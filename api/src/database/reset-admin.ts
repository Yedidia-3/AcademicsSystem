/**
 * Quick admin password reset utility.
 * Run: npm run reset-admin
 * Resets admin@jericho.rw to Admin@Jericho2025! and clears any lockout.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { AcademicYear } from '../entities/academic-year.entity';
import { Class } from '../entities/class.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Notification } from '../entities/notification.entity';
import { PLevel } from '../entities/p-level.entity';
import { ShuffleResult } from '../entities/shuffle-result.entity';
import { ShuffleSession } from '../entities/shuffle-session.entity';
import { Student } from '../entities/student.entity';
import { Zone } from '../entities/zone.entity';

dotenv.config();

function buildDbConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: +url.port || 5432,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: { rejectUnauthorized: false },
    };
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'jericho_school',
  };
}

const ds = new DataSource({
  type: 'postgres',
  ...buildDbConfig(),
  entities: [User, AcademicYear, PLevel, Class, Student, ShuffleSession, ShuffleResult, Zone, Enrollment, Notification],
  synchronize: false,
});

async function resetAdmin() {
  await ds.initialize();
  const repo = ds.getRepository(User);

  let admin = await repo.findOne({ where: { email: 'admin@jericho.rw' } });

  const NEW_PASSWORD = 'Admin@Jericho2025!';
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  if (admin) {
    admin.password = hash;
    admin.must_change_password = true;
    admin.failed_login_attempts = 0;
    admin.locked_until = null;
    admin.status = 'active';
    await repo.save(admin);
    console.log('✓ Super Admin password reset successfully');
  } else {
    admin = repo.create({
      name: 'Super Admin',
      email: 'admin@jericho.rw',
      password: hash,
      role: 'super_admin',
      must_change_password: true,
      status: 'active',
    });
    await repo.save(admin);
    console.log('✓ Super Admin created fresh');
  }

  console.log('');
  console.log('  Email:    admin@jericho.rw');
  console.log('  Password: Admin@Jericho2025!');
  console.log('  → You will be asked to set a new personal password on first login.');
  console.log('');

  await ds.destroy();
}

resetAdmin().catch((e) => { console.error(e); process.exit(1); });
