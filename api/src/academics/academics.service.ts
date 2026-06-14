import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { Class } from '../entities/class.entity';
import { PLevel } from '../entities/p-level.entity';
import { Student } from '../entities/student.entity';
import { AcademicYear } from '../entities/academic-year.entity';
import { Attendance } from '../entities/attendance.entity';
import { AttendanceSession } from '../entities/attendance-session.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(PLevel) private pLevelRepo: Repository<PLevel>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(AcademicYear) private yearRepo: Repository<AcademicYear>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    @InjectRepository(AttendanceSession) private attendanceSessionRepo: Repository<AttendanceSession>,
    private notificationsService: NotificationsService,
  ) {}

  // ─── P-Levels ────────────────────────────────────────────────────────────────

  async listAcademicYears() {
    return this.yearRepo.find({ order: { created_at: 'DESC' } });
  }

  async getPLevel(id: number) {
    const pl = await this.pLevelRepo.findOne({ where: { id } });
    if (!pl) throw new NotFoundException('P-Level not found');
    return pl;
  }

  async listPLevels(academicYearId: number) {
    // Raw SQL — TypeORM relation loading is unreliable here and doesn't carry
    // student counts. Return each P-Level with its active classes, the per-class
    // student count, and distribution status so the Dean's P-Levels module and
    // dashboard reflect distributed classes accurately.
    const plevels = await this.pLevelRepo.query(
      `SELECT id, name, academic_year_id, status
       FROM p_levels
       WHERE academic_year_id = $1 AND status = 'active'
       ORDER BY name ASC`,
      [academicYearId],
    );
    if (!plevels.length) return [];

    const plIds = plevels.map((p: any) => p.id);
    const classes = await this.classRepo.query(
      `SELECT c.id, c.name, c.p_level_id, c.teacher_id, c.distributed_at,
              (SELECT COUNT(*) FROM students s WHERE s.current_class_id = c.id) AS student_count
       FROM classes c
       WHERE c.p_level_id = ANY($1) AND c.status = 'active'
       ORDER BY c.name ASC`,
      [plIds],
    );

    const byPl = new Map<number, any[]>();
    for (const c of classes) {
      if (!byPl.has(c.p_level_id)) byPl.set(c.p_level_id, []);
      byPl.get(c.p_level_id)!.push({
        id: c.id,
        name: c.name,
        teacher_id: c.teacher_id,
        distributed_at: c.distributed_at,
        student_count: Number(c.student_count ?? 0),
      });
    }

    return plevels.map((p: any) => {
      const cls = byPl.get(p.id) ?? [];
      return {
        ...p,
        classes: cls,
        class_count: cls.length,
        student_count: cls.reduce((s: number, c: any) => s + c.student_count, 0),
        is_distributed: cls.length > 0 && cls.every((c: any) => c.distributed_at),
        any_distributed: cls.some((c: any) => c.distributed_at),
      };
    });
  }

  async createPLevel(name: string, academicYearId: number) {
    const year = await this.yearRepo.findOne({ where: { id: academicYearId } });
    if (!year) throw new NotFoundException('Academic year not found');
    const pl = this.pLevelRepo.create({ name, academic_year_id: academicYearId });
    return this.pLevelRepo.save(pl);
  }

  async deletePLevel(id: number) {
    const pl = await this.pLevelRepo.findOne({ where: { id } });
    if (!pl) throw new NotFoundException('P-Level not found');
    pl.status = 'inactive';
    await this.pLevelRepo.save(pl);
    return { message: 'P-Level deactivated' };
  }

  // ─── Classes ─────────────────────────────────────────────────────────────────

  async listClasses(pLevelId: number) {
    // Raw SQL — reliable student counts + teacher name + distribution status.
    const rows = await this.classRepo.query(
      `SELECT c.id, c.name, c.p_level_id, c.teacher_id, c.status, c.distributed_at,
              t.name AS teacher_name,
              (SELECT COUNT(*) FROM students s WHERE s.current_class_id = c.id) AS student_count
       FROM classes c
       LEFT JOIN users t ON t.id = c.teacher_id
       WHERE c.p_level_id = $1 AND c.status = 'active'
       ORDER BY c.name ASC`,
      [pLevelId],
    );
    return rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      p_level_id: c.p_level_id,
      teacher_id: c.teacher_id,
      status: c.status,
      distributed_at: c.distributed_at,
      teacher: c.teacher_id ? { id: c.teacher_id, name: c.teacher_name } : null,
      student_count: Number(c.student_count ?? 0),
    }));
  }

  async createClass(name: string, pLevelId: number) {
    const pl = await this.pLevelRepo.findOne({ where: { id: pLevelId } });
    if (!pl) throw new NotFoundException('P-Level not found');
    const cls = this.classRepo.create({ name, p_level_id: pLevelId });
    return this.classRepo.save(cls);
  }

  async deleteClass(id: number) {
    const cls = await this.classRepo.findOne({ where: { id }, relations: ['students'] });
    if (!cls) throw new NotFoundException('Class not found');
    if (cls.students?.length) throw new BadRequestException('Cannot delete class with active students. Reassign students first.');
    cls.status = 'inactive';
    await this.classRepo.save(cls);
    return { message: 'Class deactivated' };
  }

  async assignTeacher(classId: number, teacherId: number) {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');
    cls.teacher_id = teacherId;
    return this.classRepo.save(cls);
  }

  // ─── Students ────────────────────────────────────────────────────────────────

  async getStudentsByClass(classId: number) {
    return this.studentRepo.find({
      where: { current_class_id: classId },
      order: { rank: 'ASC' },
    });
  }

  async getStudentCountForPLevel(pLevelId: number, academicYearId: number) {
    const classes = await this.classRepo.find({
      where: { p_level_id: pLevelId, status: 'active' },
    });
    if (!classes.length) return { count: 0 };
    const classIds = classes.map((c) => c.id);
    const count = await this.studentRepo
      .createQueryBuilder('s')
      .where('s.current_class_id IN (:...ids)', { ids: classIds })
      .andWhere('s.academic_year_id = :yid', { yid: academicYearId })
      .getCount();
    return { count };
  }

  async moveStudent(studentId: number, newClassId: number) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    student.current_class_id = newClassId;
    return this.studentRepo.save(student);
  }

  // ─── Excel Import ─────────────────────────────────────────────────────────────

  async importExcel(pLevelId: number, academicYearId: number, buffer: Buffer) {
    const pl = await this.pLevelRepo.findOne({ where: { id: pLevelId } });
    if (!pl) throw new NotFoundException('P-Level not found');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const errors: string[] = [];
    const allStudents: Partial<Student>[] = [];

    for (const sheet of workbook.worksheets) {
      const sheetName = sheet.name.toUpperCase().trim(); // A, B, C

      // Find or create class matching sheet name
      let cls = await this.classRepo.findOne({ where: { p_level_id: pLevelId, name: sheetName } });
      if (!cls) {
        cls = this.classRepo.create({ name: sheetName, p_level_id: pLevelId });
        cls = await this.classRepo.save(cls);
      }

      const seenRanks = new Map<number, number>(); // rank -> row number
      const seenNames = new Map<string, number>();

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const name = String(row.getCell(1).value ?? '').trim();
        const rank = Number(row.getCell(2).value);
        const marks = Number(row.getCell(3).value);
        const formerClass = String(row.getCell(4).value ?? '').trim();

        if (!name) return; // skip blank rows

        if (!rank) {
          errors.push(`Sheet ${sheetName} row ${rowNumber}: Missing rank`);
          return;
        }

        if (seenRanks.has(rank)) {
          // Tie — allowed, warn only
        }
        seenRanks.set(rank, rowNumber);

        if (seenNames.has(name.toLowerCase())) {
          errors.push(`Sheet ${sheetName} row ${rowNumber}: Duplicate student name "${name}" (warning)`);
        }
        seenNames.set(name.toLowerCase(), rowNumber);

        allStudents.push({
          name,
          rank,
          marks_percentage: isNaN(marks) ? null : marks,
          former_class: formerClass || null,
          current_class_id: cls.id,
          academic_year_id: academicYearId,
          status: 'active',
        });
      });
    }

    if (errors.filter((e) => !e.includes('warning')).length > 0) {
      throw new BadRequestException({ message: 'Import validation failed', errors });
    }

    // Clear existing students for this p-level in this year
    const existingClasses = await this.classRepo.find({ where: { p_level_id: pLevelId } });
    const classIds = existingClasses.map((c) => c.id);
    if (classIds.length) {
      await this.studentRepo
        .createQueryBuilder()
        .delete()
        .where('current_class_id IN (:...ids)', { ids: classIds })
        .andWhere('academic_year_id = :yid', { yid: academicYearId })
        .execute();
    }

    await this.studentRepo.save(allStudents.map((s) => this.studentRepo.create(s)));

    return {
      message: `Imported ${allStudents.length} students across ${workbook.worksheets.length} class(es)`,
      warnings: errors.filter((e) => e.includes('warning')),
    };
  }

  // ─── Teacher portal ───────────────────────────────────────────────────────────

  async getTeacherClasses(teacherId: number) {
    // Only classes that have been DISTRIBUTED are visible to the teacher.
    const classes = await this.classRepo.query(
      `SELECT c.id, c.name, c.p_level_id, pl.name AS p_level_name,
              (SELECT COUNT(*) FROM students s WHERE s.current_class_id = c.id) AS student_count
       FROM classes c
       JOIN p_levels pl ON pl.id = c.p_level_id
       WHERE c.teacher_id = $1
         AND c.status = 'active'
         AND c.distributed_at IS NOT NULL
       ORDER BY pl.name ASC, c.name ASC`,
      [teacherId],
    );
    return classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      p_level: { id: c.p_level_id, name: c.p_level_name },
      student_count: Number(c.student_count ?? 0),
    }));
  }

  async getClassStudents(classId: number) {
    return this.studentRepo.find({
      where: { current_class_id: classId },
      order: { rank: 'ASC' },
    });
  }

  // Today's at-a-glance numbers for the teacher dashboard.
  async getTeacherTodaySummary(teacherId: number) {
    const today = new Date().toISOString().split('T')[0];

    const cls = await this.classRepo.query(
      `SELECT COUNT(*)::int AS classes,
              COALESCE(SUM((SELECT COUNT(*) FROM students st WHERE st.current_class_id = c.id)), 0)::int AS students
       FROM classes c
       WHERE c.teacher_id = $1 AND c.status = 'active' AND c.distributed_at IS NOT NULL`,
      [teacherId],
    );

    const att = await this.attendanceSessionRepo.query(
      `SELECT COALESCE(SUM(s.present),0)::int AS present,
              COALESCE(SUM(s.absent),0)::int  AS absent,
              COALESCE(SUM(s.late),0)::int    AS late,
              COUNT(*)::int                   AS marked
       FROM attendance_sessions s
       JOIN classes c ON c.id = s.class_id
       WHERE c.teacher_id = $1 AND s.date = $2`,
      [teacherId, today],
    );

    const classes = cls[0]?.classes ?? 0;
    const marked = att[0]?.marked ?? 0;
    return {
      classes,
      students: cls[0]?.students ?? 0,
      present: att[0]?.present ?? 0,
      absent: att[0]?.absent ?? 0,
      late: att[0]?.late ?? 0,
      classes_marked: marked,
      classes_pending: Math.max(0, classes - marked),
    };
  }

  // ─── Attendance ────────────────────────────────────────────────────────────

  // Class roster for a given day with each student's attendance status.
  // Once submitted the day is LOCKED (one attendance per day).
  async getClassAttendance(classId: number, date: string) {
    const students = await this.studentRepo.query(
      `SELECT id, name, rank FROM students
       WHERE current_class_id = $1 AND status != 'transferred'
       ORDER BY rank ASC NULLS LAST, name ASC`,
      [classId],
    );
    const marks = await this.attendanceRepo.query(
      `SELECT student_id, status FROM attendance WHERE class_id = $1 AND date = $2`,
      [classId, date],
    );
    const byStudent = new Map<number, string>();
    for (const m of marks) byStudent.set(m.student_id, m.status);

    const session = await this.attendanceSessionRepo.findOne({ where: { class_id: classId, date } });

    const records = students.map((s: any) => ({
      student_id: s.id,
      name: s.name,
      rank: s.rank,
      status: byStudent.get(s.id) ?? 'present',
    }));

    return {
      date,
      class_id: classId,
      locked: !!session,                 // submitted → read-only until reset
      submitted_at: session?.submitted_at ?? null,
      records,
    };
  }

  // Submit attendance for a class on a date — ONE per day. Locks the day,
  // auto-notifies the Dean(s), and archives a session row for history.
  async saveClassAttendance(
    classId: number,
    date: string,
    records: { student_id: number; status: 'present' | 'absent' | 'late' }[],
    markedBy: number,
  ) {
    if (!date) throw new BadRequestException('Date is required');

    const existingSession = await this.attendanceSessionRepo.findOne({ where: { class_id: classId, date } });
    if (existingSession) {
      throw new BadRequestException('Attendance for this day is already submitted. Use Reset to redo it.');
    }

    // Persist per-student marks
    for (const r of records ?? []) {
      const existing = await this.attendanceRepo.findOne({ where: { student_id: r.student_id, date } });
      if (existing) {
        existing.status = r.status;
        existing.class_id = classId;
        existing.marked_by = markedBy;
        await this.attendanceRepo.save(existing);
      } else {
        await this.attendanceRepo.save(
          this.attendanceRepo.create({
            student_id: r.student_id, class_id: classId, date, status: r.status, marked_by: markedBy,
          }),
        );
      }
    }

    const present = (records ?? []).filter(r => r.status === 'present').length;
    const absent = (records ?? []).filter(r => r.status === 'absent').length;
    const late = (records ?? []).filter(r => r.status === 'late').length;
    const total = records?.length ?? 0;

    // Archive the submitted session (locks the day)
    await this.attendanceSessionRepo.save(
      this.attendanceSessionRepo.create({
        class_id: classId, date, marked_by: markedBy,
        present, absent, late, total, submitted_at: new Date(),
      }),
    );

    // Auto-submit to the Dean(s)
    await this.notifyDeansOfAttendance(classId, date, markedBy, { present, absent, late, total });

    return { message: 'Attendance submitted', locked: true, present, absent, late, total };
  }

  // Reset a day's attendance so the teacher can redo it (mistake correction).
  async resetClassAttendance(classId: number, date: string, teacherId: number) {
    if (!date) throw new BadRequestException('Date is required');
    await this.attendanceRepo.query(
      `DELETE FROM attendance WHERE class_id = $1 AND date = $2`, [classId, date],
    );
    await this.attendanceSessionRepo.query(
      `DELETE FROM attendance_sessions WHERE class_id = $1 AND date = $2`, [classId, date],
    );
    // Inform the Dean the record was reset
    await this.notifyDeansOfAttendance(classId, date, teacherId, null);
    return { message: 'Attendance reset — you can record it again', locked: false };
  }

  // Submitted attendance history for a teacher's classes (archive view).
  async getTeacherAttendanceHistory(teacherId: number) {
    const rows = await this.attendanceSessionRepo.query(
      `SELECT s.id, s.class_id, s.date::text AS date, s.present, s.absent, s.late, s.total,
              s.submitted_at,
              c.name AS class_name, pl.name AS p_level_name
       FROM attendance_sessions s
       JOIN classes c ON c.id = s.class_id
       JOIN p_levels pl ON pl.id = c.p_level_id
       WHERE c.teacher_id = $1
       ORDER BY s.date DESC, s.submitted_at DESC`,
      [teacherId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      class_id: r.class_id,
      class_label: `${r.p_level_name}${r.class_name}`,
      date: r.date,
      present: r.present, absent: r.absent, late: r.late, total: r.total,
      submitted_at: r.submitted_at,
    }));
  }

  // Notify dean(s) that attendance was submitted (or reset when summary=null).
  private async notifyDeansOfAttendance(
    classId: number,
    date: string,
    teacherId: number,
    summary: { present: number; absent: number; late: number; total: number } | null,
  ) {
    const info = await this.classRepo.query(
      `SELECT pl.name AS p_level_name, c.name AS class_name, t.name AS teacher_name
       FROM classes c
       JOIN p_levels pl ON pl.id = c.p_level_id
       LEFT JOIN users t ON t.id = $2
       WHERE c.id = $1`,
      [classId, teacherId],
    );
    const label = info[0] ? `${info[0].p_level_name}${info[0].class_name}` : 'a class';
    const teacher = info[0]?.teacher_name ?? 'A teacher';
    const day = new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    const message = summary
      ? `${teacher} submitted ${label} attendance for ${day}: ${summary.present} present, ${summary.absent} absent, ${summary.late} late.`
      : `${teacher} reset ${label} attendance for ${day} to correct it.`;

    const deans = await this.classRepo.query(
      `SELECT id FROM users WHERE role = 'dean' AND status = 'active'`,
    );
    for (const d of deans) {
      await this.notificationsService.notify(d.id, message, summary ? 'info' : 'warning');
    }
  }

  // ─── Accountant portal ───────────────────────────────────────────────────────

  async getAllDistributedClasses(academicYearId: number) {
    // Only DISTRIBUTED classes are visible to the accountant.
    const classes = await this.classRepo.query(
      `SELECT c.id, c.name, c.p_level_id, pl.name AS p_level_name
       FROM classes c
       JOIN p_levels pl ON pl.id = c.p_level_id
       WHERE pl.academic_year_id = $1
         AND c.status = 'active'
         AND c.distributed_at IS NOT NULL
       ORDER BY pl.name ASC, c.name ASC`,
      [academicYearId],
    );
    if (!classes.length) return [];

    const classIds = classes.map((c: any) => c.id);
    const students = await this.studentRepo.query(
      `SELECT id, name, rank, marks_percentage, former_class, current_class_id
       FROM students
       WHERE current_class_id = ANY($1)
       ORDER BY rank ASC NULLS LAST, name ASC`,
      [classIds],
    );

    const byClass = new Map<number, any[]>();
    for (const s of students) {
      if (!byClass.has(s.current_class_id)) byClass.set(s.current_class_id, []);
      byClass.get(s.current_class_id)!.push({
        id: s.id,
        name: s.name,
        rank: s.rank,
        marks_percentage: s.marks_percentage,
        former_class: s.former_class,
      });
    }

    return classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      p_level: { id: c.p_level_id, name: c.p_level_name },
      students: byClass.get(c.id) ?? [],
    }));
  }
}
