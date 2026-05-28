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

  async createUser(dto: CreateUserDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('A user with this email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, role: dto.role as any, password: hashed });
    const saved = await this.userRepo.save(user) as any;
    const { password, ...safe } = saved as any;
    return safe;
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
    const tempPassword = Math.random().toString(36).slice(-10);
    user.password = await bcrypt.hash(tempPassword, 10);
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
