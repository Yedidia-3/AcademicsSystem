import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AcademicYear } from '../entities/academic-year.entity';
import { Class } from '../entities/class.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Notification } from '../entities/notification.entity';
import { PLevel } from '../entities/p-level.entity';
import { ShuffleResult } from '../entities/shuffle-result.entity';
import { ShuffleSession } from '../entities/shuffle-session.entity';
import { Student } from '../entities/student.entity';
import { User } from '../entities/user.entity';
import { Zone } from '../entities/zone.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'jericho',
  password: process.env.DB_PASSWORD ?? 'secret',
  database: process.env.DB_NAME ?? 'jericho_school',
  entities: [User, AcademicYear, PLevel, Class, Student, ShuffleSession, ShuffleResult, Zone, Enrollment, Notification],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database');

  const userRepo = AppDataSource.getRepository(User);

  // Super Admin — the only seeded user, root of the system
  const existing = await userRepo.findOne({ where: { email: 'admin@jericho.rw' } });
  if (!existing) {
    const hash = await bcrypt.hash('Admin@Jericho2025!', 10);
    await userRepo.save(userRepo.create({
      name: 'Super Admin',
      email: 'admin@jericho.rw',
      password: hash,
      role: 'super_admin',
      must_change_password: true, // Must set personal password on first login
    }));
    console.log('✓ Super Admin created');
    console.log('  Email:    admin@jericho.rw');
    console.log('  Password: Admin@Jericho2025!');
    console.log('  → Will be forced to set a personal password on first login.');
  } else {
    console.log('✓ Super Admin already exists');
  }

  console.log('\nSeed complete. All other users must be created by the Super Admin.');
  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
