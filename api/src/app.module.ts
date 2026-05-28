import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear } from './entities/academic-year.entity';
import { Class } from './entities/class.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Notification } from './entities/notification.entity';
import { PLevel } from './entities/p-level.entity';
import { ShuffleResult } from './entities/shuffle-result.entity';
import { ShuffleSession } from './entities/shuffle-session.entity';
import { Student } from './entities/student.entity';
import { User } from './entities/user.entity';
import { Zone } from './entities/zone.entity';
import { AcademicsModule } from './academics/academics.module';
import { AccountantModule } from './accountant/accountant.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User, AcademicYear, PLevel, Class, Student, ShuffleSession, ShuffleResult, Zone, Enrollment, Notification],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AdminModule,
    AcademicsModule,
    AccountantModule,
    NotificationsModule,
  ],
})
export class AppModule {}
