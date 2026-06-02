import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../entities/class.entity';
import { ShuffleResult } from '../../entities/shuffle-result.entity';
import { ShuffleSession } from '../../entities/shuffle-session.entity';
import { Student } from '../../entities/student.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { RunShuffleDto } from './dto/run-shuffle.dto';

@Injectable()
export class ShuffleService {
  constructor(
    @InjectRepository(ShuffleSession) private sessionRepo: Repository<ShuffleSession>,
    @InjectRepository(ShuffleResult) private resultRepo: Repository<ShuffleResult>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    private notificationsService: NotificationsService,
  ) {}

  async runShuffle(dto: RunShuffleDto, submittedBy: number) {
    // Step 1: get the active classes for this p-level (same query as the count endpoint)
    const pLevelClasses = await this.classRepo.find({
      where: { p_level_id: dto.p_level_id, status: 'active' },
      order: { name: 'ASC' },
    });

    if (!pLevelClasses.length) {
      throw new BadRequestException('No classes found for this P-level. Please create classes or import students first.');
    }

    const classIds = pLevelClasses.map((c) => c.id);

    // Step 2: load students using direct column comparison (same approach as student-count endpoint)
    const students = await this.studentRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.current_class', 'c')
      .where('s.current_class_id IN (:...ids)', { ids: classIds })
      .andWhere('s.academic_year_id = :yid', { yid: dto.academic_year_id })
      .orderBy('s.rank', 'ASC', 'NULLS LAST')
      .addOrderBy('c.name', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .getMany();

    if (!students.length) {
      throw new BadRequestException('No students found for this P-level. Please import students first.');
    }

    // Target classes = same p-level's classes (shuffle redistributes within P1 A/B/C)
    const targetClasses = pLevelClasses;

    // For auto_promote with 1 class, just map 1:1
    const classCount = targetClasses.length || 1;

    // Create shuffle session
    const session = this.sessionRepo.create({
      academic_year_id: dto.academic_year_id,
      p_level_id: dto.p_level_id,
      algorithm: dto.algorithm as any,
      status: 'in_progress',
      submitted_by: submittedBy,
    });
    const savedSession = await this.sessionRepo.save(session);

    // Delete existing results for this session
    await this.resultRepo.delete({ shuffle_session_id: savedSession.id });

    // Run the algorithm
    const assignments = this.applyAlgorithm(dto.algorithm, students, targetClasses);

    // Persist results
    const results = assignments.map(({ student, classObj }) =>
      this.resultRepo.create({
        shuffle_session_id: savedSession.id,
        student_id: student.id,
        proposed_class_id: classObj.id,
        is_manual_override: false,
      }),
    );
    await this.resultRepo.save(results);

    return this.getPreview(savedSession.id);
  }

  private applyAlgorithm(algorithm: string, students: Student[], classes: Class[]) {
    if (!classes.length) return students.map((s) => ({ student: s, classObj: s.current_class }));

    switch (algorithm) {
      case 'round_robin':
        return this.roundRobin(students, classes);
      case 'snake_draft':
        return this.snakeDraft(students, classes);
      case 'balanced_bands':
        return this.balancedBands(students, classes);
      default:
        return this.roundRobin(students, classes);
    }
  }

  private roundRobin(students: Student[], classes: Class[]) {
    return students.map((student, i) => ({
      student,
      classObj: classes[i % classes.length],
    }));
  }

  private snakeDraft(students: Student[], classes: Class[]) {
    return students.map((student, i) => {
      const round = Math.floor(i / classes.length);
      const pos = i % classes.length;
      const idx = round % 2 === 0 ? pos : classes.length - 1 - pos;
      return { student, classObj: classes[idx] };
    });
  }

  private balancedBands(students: Student[], classes: Class[]) {
    const n = students.length;
    const bandSize = Math.ceil(n / 3);
    // Split into top / mid / bottom thirds
    const top = students.slice(0, bandSize);
    const mid = students.slice(bandSize, bandSize * 2);
    const bot = students.slice(bandSize * 2);

    const result: { student: Student; classObj: Class }[] = [];
    const buckets: Student[][] = classes.map(() => []);

    [top, mid, bot].forEach((band) => {
      band.forEach((student, i) => {
        buckets[i % classes.length].push(student);
      });
    });

    buckets.forEach((bucket, ci) => {
      bucket.forEach((student) => result.push({ student, classObj: classes[ci] }));
    });

    return result;
  }

  async getPreview(sessionId: number) {
    const results = await this.resultRepo.find({
      where: { shuffle_session_id: sessionId },
      relations: ['student', 'student.current_class', 'proposed_class', 'proposed_class.p_level'],
      order: { proposed_class_id: 'ASC' },
    });

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['p_level'],
    });

    const grouped: Record<string, any[]> = {};
    for (const r of results) {
      const label = `${r.proposed_class.p_level.name}${r.proposed_class.name}`;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push({
        result_id: r.id,
        student_id: r.student.id,
        name: r.student.name,
        former_class: r.student.former_class ?? r.student.current_class?.name,
        rank: r.student.rank,
        marks_percentage: r.student.marks_percentage,
        new_class: label,
        new_class_id: r.proposed_class_id,
        is_manual_override: r.is_manual_override,
      });
    }

    const summary = Object.entries(grouped).map(([label, rows]) => ({ class: label, count: rows.length }));

    return { session, grouped, summary };
  }

  async adjustStudent(sessionId: number, resultId: number, newClassId: number) {
    const result = await this.resultRepo.findOne({ where: { id: resultId, shuffle_session_id: sessionId } });
    if (!result) throw new NotFoundException('Result not found');
    result.proposed_class_id = newClassId;
    result.is_manual_override = true;
    await this.resultRepo.save(result);
    return this.getPreview(sessionId);
  }

  async submitForApproval(sessionId: number, deanId: number, principalId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'in_progress') throw new BadRequestException('Session is not in progress');

    session.status = 'pending_approval';
    session.submitted_at = new Date();
    await this.sessionRepo.save(session);

    await this.notificationsService.notify(
      principalId,
      `Dean has submitted a class list for P-level approval (Session #${sessionId}).`,
      'info',
    );

    return { message: 'Submitted for Principal approval' };
  }

  async approve(sessionId: number, principalId: number, deanId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'pending_approval') throw new BadRequestException('Session is not pending approval');

    session.status = 'approved';
    session.reviewed_by = principalId;
    session.reviewed_at = new Date();
    await this.sessionRepo.save(session);

    await this.notificationsService.notify(
      deanId,
      `Class list for Session #${sessionId} has been approved. Ready for distribution.`,
      'success',
    );

    return { message: 'Approved successfully' };
  }

  async reject(sessionId: number, principalId: number, deanId: number, note: string) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'pending_approval') throw new BadRequestException('Session is not pending approval');

    session.status = 'rejected';
    session.reviewed_by = principalId;
    session.reviewed_at = new Date();
    session.rejection_note = note;
    await this.sessionRepo.save(session);

    await this.notificationsService.notify(
      deanId,
      `Class list for Session #${sessionId} was rejected. Note: ${note}. Please review and resubmit.`,
      'error',
    );

    return { message: 'Rejected and Dean notified' };
  }

  async distribute(sessionId: number, deanId: number, accountantId: number, teacherAssignments: { class_id: number; teacher_id: number }[]) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['results', 'results.proposed_class'],
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'approved') throw new BadRequestException('Session must be approved before distribution');

    // Apply teacher assignments
    for (const ta of teacherAssignments) {
      await this.classRepo.update(ta.class_id, { teacher_id: ta.teacher_id });
    }

    // Promote students to new classes
    for (const result of session.results) {
      await this.studentRepo.update(result.student_id, { current_class_id: result.proposed_class_id, status: 'promoted' });
    }

    session.status = 'distributed';
    session.distributed_at = new Date();
    await this.sessionRepo.save(session);

    // Notify accountant
    if (accountantId) {
      await this.notificationsService.notify(accountantId, `A new class list has been distributed (Session #${sessionId}). Check your portal.`);
    }

    // Notify each assigned teacher
    for (const ta of teacherAssignments) {
      const cls = await this.classRepo.findOne({ where: { id: ta.class_id }, relations: ['p_level'] });
      if (cls) {
        const label = `${cls.p_level?.name ?? ''}${cls.name}`;
        await this.notificationsService.notify(ta.teacher_id, `Your new class list for ${label} is ready.`);
      }
    }

    return { message: 'Distributed successfully' };
  }

  async getPendingApprovals() {
    return this.sessionRepo.find({
      where: { status: 'pending_approval' },
      relations: ['p_level', 'submitted_by_user'],
      order: { submitted_at: 'ASC' },
    });
  }
}
