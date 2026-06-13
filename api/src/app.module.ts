import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
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
import { Attendance } from './entities/attendance.entity';
import { AcademicsModule } from './academics/academics.module';
import { AccountantModule } from './accountant/accountant.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        // Railway provides DATABASE_URL; fall back to individual vars for local dev.
        const databaseUrl = config.get<string>('DATABASE_URL');
        let dbConn: Record<string, any>;
        if (databaseUrl) {
          const url = new URL(databaseUrl);
          dbConn = {
            host: url.hostname,
            port: +url.port || 5432,
            username: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ''),
            ssl: { rejectUnauthorized: false },
          };
        } else {
          dbConn = {
            host: config.get('DB_HOST', 'localhost'),
            port: +(config.get('DB_PORT') ?? 5432),
            username: config.get('DB_USERNAME', 'postgres'),
            password: config.get('DB_PASSWORD', ''),
            database: config.get('DB_NAME', 'jericho_school'),
          };
        }
        return {
          type: 'postgres',
          ...dbConn,
          entities: [User, AcademicYear, PLevel, Class, Student, ShuffleSession, ShuffleResult, Zone, Enrollment, Notification, Attendance],
          // In production, disable auto-sync by default.
          // Set SYNCHRONIZE_DB=true on the first Railway deploy to create tables,
          // then remove/set to false once the schema is stable.
          synchronize: config.get('SYNCHRONIZE_DB') === 'true' || config.get('NODE_ENV') !== 'production',
          logging: config.get('NODE_ENV') === 'development',
        };
      },
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
