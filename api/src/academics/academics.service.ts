import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { Class } from '../entities/class.entity';
import { PLevel } from '../entities/p-level.entity';
import { Student } from '../entities/student.entity';
import { AcademicYear } from '../entities/academic-year.entity';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(PLevel) private pLevelRepo: Repository<PLevel>,
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(AcademicYear) private yearRepo: Repository<AcademicYear>,
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
    return this.pLevelRepo.find({
      where: { academic_year_id: academicYearId, status: 'active' },
      relations: ['classes'],
      order: { name: 'ASC' },
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
    return this.classRepo.find({
      where: { p_level_id: pLevelId, status: 'active' },
      relations: ['teacher'],
      order: { name: 'ASC' },
    });
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
    return this.classRepo.find({
      where: { teacher_id: teacherId, status: 'active' },
      relations: ['p_level', 'students'],
    });
  }

  async getClassStudents(classId: number) {
    return this.studentRepo.find({
      where: { current_class_id: classId },
      order: { rank: 'ASC' },
    });
  }

  // ─── Accountant portal ───────────────────────────────────────────────────────

  async getAllDistributedClasses(academicYearId: number) {
    return this.classRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.p_level', 'pl')
      .leftJoinAndSelect('c.students', 's')
      .where('pl.academic_year_id = :yid', { yid: academicYearId })
      .andWhere('c.status = :status', { status: 'active' })
      .orderBy('pl.name', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .getMany();
  }
}
