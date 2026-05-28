import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(AcademicYear) private yearRepo: Repository<AcademicYear>,
  ) {}

  async listUsers() {
    return this.userRepo.find({
      select: ['id', 'name', 'email', 'role', 'status', 'last_login', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  private generateTempPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const specials = '@#!$';
    const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
    // Format: 2 upper + 3 lower + 2 digits + 1 special = 8 chars, always meets complexity
    const pwd = rand(upper) + rand(upper) + rand(lower) + rand(lower) + rand(lower) + rand(digits) + rand(digits) + rand(specials);
    // Shuffle
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
    // Return temp password ONCE so admin can share it with the user
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
}
