import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../entities/class.entity';
import { PLevel } from '../../entities/p-level.entity';
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
    @InjectRepository(PLevel) private pLevelRepo: Repository<PLevel>,
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
    // Load session by itself (no relation — avoids TypeORM relation bugs)
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Shuffle session not found');

    // Load p_level directly using its own repo (100% reliable)
    const pLevel = await this.pLevelRepo.findOne({ where: { id: session.p_level_id } });
    const pLevelName = pLevel?.name ?? '';

    // Load classes directly (used for the id→name map returned to frontend)
    const pLevelClasses = await this.classRepo.find({
      where: { p_level_id: session.p_level_id, status: 'active' },
      order: { name: 'ASC' },
    });
    const classes = pLevelClasses.map((c) => ({
      id: c.id,
      name: `${pLevelName}${c.name}`,
    }));

    // Raw SQL — bypasses all TypeORM relation-mapping ambiguities completely.
    // We join shuffle_results → students → classes manually and map to shape.
    const rawRows: {
      result_id: number;
      student_id: number;
      proposed_class_id: number;
      is_manual_override: boolean;
      student_name: string;
      former_class: string | null;
      rank: number | null;
      marks_percentage: number | null;
      sc_name: string | null;   // student's current class name
      pc_name: string;           // proposed class name
    }[] = await this.resultRepo.query(
      `SELECT
         r.id              AS result_id,
         r.student_id,
         r.proposed_class_id,
         r.is_manual_override,
         s.name            AS student_name,
         s.former_class,
         s.rank,
         s.marks_percentage,
         sc.name           AS sc_name,
         pc.name           AS pc_name
       FROM shuffle_results r
       JOIN students   s  ON s.id  = r.student_id
       JOIN classes    pc ON pc.id = r.proposed_class_id
       LEFT JOIN classes sc ON sc.id = s.current_class_id
       WHERE r.shuffle_session_id = $1
       ORDER BY r.proposed_class_id ASC`,
      [sessionId],
    );

    const grouped: Record<string, any[]> = {};
    for (const r of rawRows) {
      const label = `${pLevelName}${r.pc_name ?? ''}`;
      if (!label.trim()) continue;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push({
        result_id: r.result_id,
        student_id: r.student_id,
        name: r.student_name ?? '—',
        former_class: r.former_class ?? r.sc_name ?? '—',
        rank: r.rank,
        marks_percentage: r.marks_percentage,
        new_class: label,
        new_class_id: r.proposed_class_id,
        is_manual_override: r.is_manual_override,
      });
    }

    const summary = Object.entries(grouped).map(([label, rows]) => ({
      class: label,
      count: rows.length,
    }));

    // Attach pLevel to session object so the frontend interface stays intact
    const sessionOut = { ...session, p_level: pLevel };

    return { session: sessionOut, grouped, summary, classes };
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
    // Raw SQL for reliability (TypeORM relation loading is flaky on this schema)
    const rows = await this.sessionRepo.query(
      `SELECT ss.id, ss.status, ss.algorithm, ss.p_level_id,
              ss.submitted_at, ss.reviewed_at, ss.distributed_at, ss.rejection_note,
              pl.name AS p_level_name,
              u.name  AS submitted_by_name,
              (SELECT COUNT(*) FROM shuffle_results r WHERE r.shuffle_session_id = ss.id) AS student_count
       FROM shuffle_sessions ss
       JOIN p_levels pl ON pl.id = ss.p_level_id
       LEFT JOIN users u ON u.id = ss.submitted_by
       WHERE ss.status = 'pending_approval'
       ORDER BY ss.submitted_at ASC`,
    );
    return rows.map(this.mapSessionRow);
  }

  // Lists every shuffle session (for the Dean's Distribution module)
  async getDeanSessions() {
    const rows = await this.sessionRepo.query(
      `SELECT ss.id, ss.status, ss.algorithm, ss.p_level_id,
              ss.submitted_at, ss.reviewed_at, ss.distributed_at, ss.rejection_note,
              pl.name AS p_level_name,
              u.name  AS submitted_by_name,
              (SELECT COUNT(*) FROM shuffle_results r WHERE r.shuffle_session_id = ss.id) AS student_count
       FROM shuffle_sessions ss
       JOIN p_levels pl ON pl.id = ss.p_level_id
       LEFT JOIN users u ON u.id = ss.submitted_by
       ORDER BY ss.updated_at DESC`,
    );
    return rows.map(this.mapSessionRow);
  }

  private mapSessionRow = (r: any) => ({
    id: r.id,
    status: r.status,
    algorithm: r.algorithm,
    p_level: { id: r.p_level_id, name: r.p_level_name },
    submitted_by_name: r.submitted_by_name,
    student_count: Number(r.student_count ?? 0),
    submitted_at: r.submitted_at,
    reviewed_at: r.reviewed_at,
    distributed_at: r.distributed_at,
    rejection_note: r.rejection_note,
  });
}
