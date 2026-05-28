import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { Class } from '../entities/class.entity';
import { PLevel } from '../entities/p-level.entity';
import { ShuffleResult } from '../entities/shuffle-result.entity';
import { ShuffleSession } from '../entities/shuffle-session.entity';
import { Student } from '../entities/student.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';
import { ShuffleController } from './shuffle/shuffle.controller';
import { ShuffleService } from './shuffle/shuffle.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PLevel, Class, Student, ShuffleSession, ShuffleResult, AcademicYear]),
    NotificationsModule,
  ],
  controllers: [AcademicsController, ShuffleController],
  providers: [AcademicsService, ShuffleService],
  exports: [AcademicsService],
})
export class AcademicsModule {}
