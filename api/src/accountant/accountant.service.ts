import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { Zone } from '../entities/zone.entity';
import { Student } from '../entities/student.entity';
import { BulkEnrollDto } from './enrollments/dto/bulk-enroll.dto';
import { CreateEnrollmentDto } from './enrollments/dto/create-enrollment.dto';
import { CreateZoneDto } from './zones/dto/create-zone.dto';

@Injectable()
export class AccountantService {
  constructor(
    @InjectRepository(Zone) private zoneRepo: Repository<Zone>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  // ─── Zones ──────────────────────────────────────────────────────────────────

  async listZones() {
    return this.zoneRepo.find({ where: { status: 'active' }, order: { name: 'ASC' } });
  }

  async createZone(dto: CreateZoneDto) {
    const zone = this.zoneRepo.create(dto);
    return this.zoneRepo.save(zone);
  }

  async updateZone(id: number, dto: Partial<CreateZoneDto>) {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    Object.assign(zone, dto);
    return this.zoneRepo.save(zone);
  }

  async deleteZone(id: number) {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    const inUse = await this.enrollmentRepo.count({ where: { zone_id: id, status: 'active' } });
    if (inUse > 0) throw new BadRequestException(`Zone is assigned to ${inUse} active enrollment(s). Reassign first.`);
    zone.status = 'inactive';
    await this.zoneRepo.save(zone);
    return { message: 'Zone removed' };
  }

  // ─── Enrollments ─────────────────────────────────────────────────────────────

  async listEnrollments(type?: 'feeding' | 'transport') {
    // Raw SQL — nested TypeORM relations (student.current_class.p_level) load
    // unreliably on this schema and silently return null, which makes the
    // enrollment screens appear empty. This always returns the full shape.
    const params: any[] = [];
    let typeClause = '';
    if (type) { params.push(type); typeClause = `AND e.type = $${params.length}`; }

    const rows = await this.enrollmentRepo.query(
      `SELECT e.id, e.student_id, e.type, e.meal_type, e.zone_id,
              e.payment_date::text  AS payment_date,
              e.duration_days,
              e.expiry_date::text   AS expiry_date,
              e.status,
              s.name AS student_name,
              c.id   AS class_id,   c.name AS class_name,
              pl.id  AS p_level_id, pl.name AS p_level_name,
              z.id   AS zone_pk,    z.name AS zone_name, z.price AS zone_price
       FROM enrollments e
       JOIN students s        ON s.id  = e.student_id
       LEFT JOIN classes c    ON c.id  = s.current_class_id
       LEFT JOIN p_levels pl  ON pl.id = c.p_level_id
       LEFT JOIN zones z      ON z.id  = e.zone_id
       WHERE e.status = 'active' ${typeClause}
       ORDER BY e.created_at DESC`,
      params,
    );
    return rows.map(this.mapEnrollmentRow);
  }

  private mapEnrollmentRow = (r: any) => ({
    id: r.id,
    student_id: r.student_id,
    type: r.type,
    meal_type: r.meal_type,
    zone_id: r.zone_id,
    payment_date: r.payment_date,
    duration_days: r.duration_days,
    expiry_date: r.expiry_date,
    status: r.status,
    student: {
      id: r.student_id,
      name: r.student_name,
      current_class: r.class_id
        ? {
            id: r.class_id,
            name: r.class_name,
            p_level: r.p_level_id ? { id: r.p_level_id, name: r.p_level_name } : null,
          }
        : null,
    },
    zone: r.zone_pk ? { id: r.zone_pk, name: r.zone_name, price: Number(r.zone_price) } : null,
  });

  async createEnrollment(dto: CreateEnrollmentDto) {
    const student = await this.studentRepo.findOne({ where: { id: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');

    // Calculate expiry date
    const paymentDate = new Date(dto.payment_date);
    const expiryDate = new Date(paymentDate);
    expiryDate.setDate(expiryDate.getDate() + dto.duration_days);

    const enrollment = this.enrollmentRepo.create({
      ...dto,
      expiry_date: expiryDate.toISOString().split('T')[0],
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async updateEnrollment(id: number, dto: Partial<CreateEnrollmentDto>) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (dto.payment_date && dto.duration_days) {
      const paymentDate = new Date(dto.payment_date);
      const expiryDate = new Date(paymentDate);
      expiryDate.setDate(expiryDate.getDate() + dto.duration_days);
      (dto as any).expiry_date = expiryDate.toISOString().split('T')[0];
    }

    Object.assign(enrollment, dto);
    return this.enrollmentRepo.save(enrollment);
  }

  // Bulk-enroll a whole distributed class/p-level into feeding or transport.
  // Students who already have an active enrollment of that type are skipped.
  async bulkEnroll(dto: BulkEnrollDto) {
    const paymentDate = new Date(dto.payment_date);
    const expiry = new Date(paymentDate);
    expiry.setDate(expiry.getDate() + dto.duration_days);
    const expiryStr = expiry.toISOString().split('T')[0];

    let created = 0;
    let skipped = 0;

    for (const sid of dto.student_ids) {
      const existing = await this.enrollmentRepo.findOne({
        where: { student_id: sid, type: dto.type, status: 'active' },
      });
      if (existing) { skipped++; continue; }

      const enrollment = this.enrollmentRepo.create({
        student_id: sid,
        type: dto.type,
        meal_type: dto.type === 'feeding' ? (dto.meal_type ?? 'both') : null,
        zone_id: dto.type === 'transport' ? (dto.zone_id ?? null) : null,
        payment_date: dto.payment_date,
        duration_days: dto.duration_days,
        expiry_date: expiryStr,
      });
      await this.enrollmentRepo.save(enrollment);
      created++;
    }

    return { created, skipped, total: dto.student_ids.length };
  }

  // Waive (archive) a student's active enrollment of a given type — used by the
  // slide-to-reveal trash action in the Class List module.
  async waiveByStudent(studentId: number, type: 'feeding' | 'transport') {
    const active = await this.enrollmentRepo.find({
      where: { student_id: studentId, type, status: 'active' },
    });
    for (const e of active) {
      e.status = 'archived';
      await this.enrollmentRepo.save(e);
    }
    return { waived: active.length };
  }

  async archiveEnrollment(id: number) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    enrollment.status = 'archived';
    await this.enrollmentRepo.save(enrollment);
    return { message: 'Enrollment archived' };
  }

  async getExpiringEnrollments(daysAhead = 3) {
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() + daysAhead);
    const todayStr = today.toISOString().split('T')[0];
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const rows = await this.enrollmentRepo.query(
      `SELECT e.id, e.student_id, e.type, e.meal_type, e.zone_id,
              e.payment_date::text  AS payment_date,
              e.duration_days,
              e.expiry_date::text   AS expiry_date,
              e.status,
              s.name AS student_name,
              c.id   AS class_id,   c.name AS class_name,
              pl.id  AS p_level_id, pl.name AS p_level_name,
              z.id   AS zone_pk,    z.name AS zone_name, z.price AS zone_price
       FROM enrollments e
       JOIN students s        ON s.id  = e.student_id
       LEFT JOIN classes c    ON c.id  = s.current_class_id
       LEFT JOIN p_levels pl  ON pl.id = c.p_level_id
       LEFT JOIN zones z      ON z.id  = e.zone_id
       WHERE e.status = 'active'
         AND e.expiry_date >= $1 AND e.expiry_date <= $2
       ORDER BY e.expiry_date ASC`,
      [todayStr, cutoffStr],
    );
    return rows.map(this.mapEnrollmentRow);
  }

  // ─── Cron helper: fire expiry notifications ──────────────────────────────────

  async getEnrollmentsExpiringInDays(days: number) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const targetStr = target.toISOString().split('T')[0];

    return this.enrollmentRepo.find({
      where: { expiry_date: targetStr, status: 'active' },
      relations: ['student', 'student.current_class'],
    });
  }
}
