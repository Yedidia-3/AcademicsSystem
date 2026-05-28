import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AcademicYear } from '../entities/academic-year.entity';
import { User } from '../entities/user.entity';
import { PLevel } from '../entities/p-level.entity';
import { Class } from '../entities/class.entity';
import { Student } from '../entities/student.entity';
import { ShuffleSession } from '../entities/shuffle-session.entity';
import { ShuffleResult } from '../entities/shuffle-result.entity';
import { Zone } from '../entities/zone.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Notification } from '../entities/notification.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'jericho_school',
  entities: [User, AcademicYear, PLevel, Class, Student, ShuffleSession, ShuffleResult, Zone, Enrollment, Notification],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database');

  const userRepo = AppDataSource.getRepository(User);
  const yearRepo = AppDataSource.getRepository(AcademicYear);
  const pLevelRepo = AppDataSource.getRepository(PLevel);
  const classRepo = AppDataSource.getRepository(Class);

  // Super Admin
  const existing = await userRepo.findOne({ where: { email: 'admin@jericho.rw' } });
  if (!existing) {
    const hash = await bcrypt.hash('password', 10);
    await userRepo.save(userRepo.create({ name: 'Super Admin', email: 'admin@jericho.rw', password: hash, role: 'super_admin' }));
    console.log('Super Admin created: admin@jericho.rw / password');
  }

  // Academic year
  let year = await yearRepo.findOne({ where: { name: '2025-2026' } });
  if (!year) {
    year = await yearRepo.save(yearRepo.create({ name: '2025-2026', status: 'active' }));
    console.log('Academic year 2025-2026 created');
  }

  // P-levels P1–P5 with classes A, B, C
  for (let p = 1; p <= 5; p++) {
    const pName = `P${p}`;
    let pl = await pLevelRepo.findOne({ where: { name: pName, academic_year_id: year.id } });
    if (!pl) {
      pl = await pLevelRepo.save(pLevelRepo.create({ name: pName, academic_year_id: year.id }));
      for (const cls of ['A', 'B', 'C']) {
        await classRepo.save(classRepo.create({ name: cls, p_level_id: pl.id }));
      }
      console.log(`${pName} created with classes A, B, C`);
    }
  }

  console.log('Seed complete');
  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
