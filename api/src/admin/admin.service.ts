import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { PLevel } from '../entities/p-level.entity';
import { ShuffleSession } from '../entities/shuffle-session.entity';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(AcademicYear) private yearRepo: Repository<AcademicYear>,
    @InjectRepository(ShuffleSession) private shuffleSessionRepo: Repository<ShuffleSession>,
    @InjectRepository(PLevel) private pLevelRepo: Repository<PLevel>,
  ) {}

  async listUsers() {
    return this.userRepo.find({
      select: ['id', 'name', 'email', 'role', 'status', 'must_change_password', 'last_login', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  /** Returns non-admin staff (dean, principal, teacher, accountant) — accessible to dean/principal */
  async listStaff(role?: string) {
    const qb = this.userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.email', 'u.role', 'u.status'])
      .where('u.role != :admin', { admin: 'super_admin' })
      .andWhere('u.status = :status', { status: 'active' });
    if (role) qb.andWhere('u.role = :role', { role });
    return qb.orderBy('u.name', 'ASC').getMany();
  }

  private generateTempPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const specials = '@#!$';
    const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
    const pwd = rand(upper) + rand(upper) + rand(lower) + rand(lower) + rand(lower) + rand(digits) + rand(digits) + rand(specials);
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  }

  async createUser(dto: CreateUserDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('A user with this email already exists');

    const tempPassword = this.generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      role: dto.role as any,
      password: hashed,
      must_change_password: true,
    });
    const saved = await this.userRepo.save(user);
    const { password, ...safe } = saved as any;
    return { ...safe, temp_password: tempPassword };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const { password, ...safe } = saved;
    return safe;
  }

  async deactivateUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.status = 'inactive';
    await this.userRepo.save(user);
    return { message: `User ${user.name} has been deactivated` };
  }

  async resetPassword(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const tempPassword = this.generateTempPassword();
    user.password = await bcrypt.hash(tempPassword, 10);
    user.must_change_password = true;
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await this.userRepo.save(user);
    return { message: 'Password reset successfully', temp_password: tempPassword };
  }

  async listAcademicYears() {
    return this.yearRepo.find({ order: { created_at: 'DESC' } });
  }

  async createAcademicYear(name: string) {
    const exists = await this.yearRepo.findOne({ where: { name } });
    if (exists) throw new BadRequestException('Academic year already exists');
    const year = this.yearRepo.create({ name });
    return this.yearRepo.save(year);
  }

  async archiveAcademicYear(id: number) {
    const year = await this.yearRepo.findOne({ where: { id } });
    if (!year) throw new NotFoundException('Academic year not found');
    if (year.status === 'archived') throw new BadRequestException('Already archived');
    year.status = 'archived';
    year.archived_at = new Date();
    return this.yearRepo.save(year);
  }

  async getAuditLog() {
    const entries: any[] = [];

    // Shuffle session events
    const sessions = await this.shuffleSessionRepo
      .createQueryBuilder('ss')
      .leftJoinAndSelect('ss.submitted_by_user', 'su')
      .leftJoinAndSelect('ss.reviewed_by_user', 'ru')
      .leftJoinAndSelect('ss.p_level', 'pl')
      .orderBy('ss.updated_at', 'DESC')
      .take(200)
      .getMany();

    for (const s of sessions) {
      const algo = s.algorithm?.replace(/_/g, ' ') ?? 'unknown';
      if (s.submitted_at) {
        entries.push({
          timestamp: s.submitted_at,
          user: s.submitted_by_user?.name ?? 'Dean',
          role: s.submitted_by_user?.role?.replace('_', ' ') ?? 'dean',
          action: 'Class list submitted',
          details: `Submitted ${s.p_level?.name ?? ''} for approval (${algo})`,
          ip_address: '—',
        });
      }
      if (s.reviewed_at && (s.status === 'approved' || s.status === 'distributed')) {
        entries.push({
          timestamp: s.reviewed_at,
          user: s.reviewed_by_user?.name ?? 'Principal',
          role: s.reviewed_by_user?.role?.replace('_', ' ') ?? 'principal',
          action: 'Class list approved',
          details: `Approved ${s.p_level?.name ?? ''} class distribution`,
          ip_address: '—',
        });
      }
      if (s.reviewed_at && s.status === 'rejected') {
        entries.push({
          timestamp: s.reviewed_at,
          user: s.reviewed_by_user?.name ?? 'Principal',
          role: s.reviewed_by_user?.role?.replace('_', ' ') ?? 'principal',
          action: 'Class list rejected',
          details: `Rejected ${s.p_level?.name ?? ''}: ${s.rejection_note ?? ''}`,
          ip_address: '—',
        });
      }
      if (s.distributed_at) {
        entries.push({
          timestamp: s.distributed_at,
          user: s.submitted_by_user?.name ?? 'Dean',
          role: s.submitted_by_user?.role?.replace('_', ' ') ?? 'dean',
          action: `${s.p_level?.name ?? ''} distributed`,
          details: `Distributed class list to teachers and accountant`,
          ip_address: '—',
        });
      }
    }

    // User creation events
    const users = await this.userRepo.find({
      select: ['id', 'name', 'role', 'created_at'] as any,
      order: { created_at: 'DESC' },
      take: 100,
    });
    for (const u of users) {
      entries.push({
        timestamp: u.created_at,
        user: 'Super Admin',
        role: 'super admin',
        action: 'User created',
        details: `Created ${(u.role as string).replace(/_/g, ' ')} account: ${u.name}`,
        ip_address: '—',
      });
    }

    // Academic year events
    const years = await this.yearRepo.find({ order: { created_at: 'DESC' }, take: 20 });
    for (const y of years) {
      entries.push({
        timestamp: y.created_at,
        user: 'Super Admin',
        role: 'super admin',
        action: 'Academic year created',
        details: `Created academic year ${y.name}`,
        ip_address: '—',
      });
      if (y.archived_at) {
        entries.push({
          timestamp: y.archived_at,
          user: 'Super Admin',
          role: 'super admin',
          action: 'Academic year archived',
          details: `Archived academic year ${y.name}`,
          ip_address: '—',
        });
      }
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
