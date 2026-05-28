import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { User } from '../entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AcademicYear])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
