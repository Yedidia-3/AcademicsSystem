import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { Zone } from '../entities/zone.entity';
import { Student } from '../entities/student.entity';
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
    const where: any = { status: 'active' };
    if (type) where.type = type;
    return this.enrollmentRepo.find({
      where,
      relations: ['student', 'student.current_class', 'student.current_class.p_level', 'zone'],
      order: { created_at: 'DESC' },
    });
  }

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

    const cutoffStr = cutoff.toISOString().split('T')[0];

    return this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.student', 's')
      .leftJoinAndSelect('s.current_class', 'c')
      .leftJoinAndSelect('c.p_level', 'pl')
      .leftJoinAndSelect('e.zone', 'z')
      .where('e.status = :status', { status: 'active' })
      .andWhere('e.expiry_date <= :cutoff', { cutoff: cutoffStr })
      .andWhere('e.expiry_date >= :today', { today: today.toISOString().split('T')[0] })
      .orderBy('e.expiry_date', 'ASC')
      .getMany();
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
