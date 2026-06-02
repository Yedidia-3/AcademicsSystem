import {
  Body, Controller, Delete, Get, Param, Post, Put,
  Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../entities/user.entity';
import { AcademicsService } from './academics.service';

@Controller('api/v1/academics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
  constructor(private academicsService: AcademicsService) {}

  // Academic Years (shared — accessible to all roles)
  @Get('academic-years')
  @Roles('dean', 'principal', 'teacher', 'accountant', 'super_admin')
  listAcademicYears() {
    return this.academicsService.listAcademicYears();
  }

  // P-Levels
  @Get('p-levels')
  @Roles('dean', 'principal', 'teacher', 'accountant')
  listPLevels(@Query('academic_year_id') yearId: string) {
    return this.academicsService.listPLevels(+yearId);
  }

  @Get('p-levels/:id')
  @Roles('dean', 'principal', 'teacher', 'accountant')
  getPLevel(@Param('id') id: string) {
    return this.academicsService.getPLevel(+id);
  }

  @Post('p-levels')
  @Roles('dean')
  createPLevel(@Body('name') name: string, @Body('academic_year_id') yearId: number) {
    return this.academicsService.createPLevel(name, yearId);
  }

  @Delete('p-levels/:id')
  @Roles('dean')
  deletePLevel(@Param('id') id: string) {
    return this.academicsService.deletePLevel(+id);
  }

  // Classes
  @Get('p-levels/:id/classes')
  @Roles('dean', 'principal', 'teacher', 'accountant')
  listClasses(@Param('id') id: string) {
    return this.academicsService.listClasses(+id);
  }

  @Get('p-levels/:id/student-count')
  @Roles('dean', 'principal', 'teacher', 'accountant')
  getStudentCount(
    @Param('id') id: string,
    @Query('academic_year_id') yearId: string,
  ) {
    return this.academicsService.getStudentCountForPLevel(+id, +yearId);
  }

  @Post('classes')
  @Roles('dean')
  createClass(@Body('name') name: string, @Body('p_level_id') pLevelId: number) {
    return this.academicsService.createClass(name, pLevelId);
  }

  @Delete('classes/:id')
  @Roles('dean')
  deleteClass(@Param('id') id: string) {
    return this.academicsService.deleteClass(+id);
  }

  @Put('classes/:id/assign-teacher')
  @Roles('dean')
  assignTeacher(@Param('id') id: string, @Body('teacher_id') teacherId: number) {
    return this.academicsService.assignTeacher(+id, teacherId);
  }

  // Students
  @Get('classes/:id/students')
  @Roles('dean', 'principal', 'teacher', 'accountant')
  getStudents(@Param('id') id: string) {
    return this.academicsService.getClassStudents(+id);
  }

  @Put('students/:id/move')
  @Roles('dean')
  moveStudent(@Param('id') id: string, @Body('new_class_id') newClassId: number) {
    return this.academicsService.moveStudent(+id, newClassId);
  }

  // Excel import
  @Post('p-levels/:id/import')
  @Roles('dean')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importExcel(
    @Param('id') id: string,
    @Query('academic_year_id') yearId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('No file uploaded');
    return this.academicsService.importExcel(+id, +yearId, file.buffer);
  }

  // Teacher portal
  @Get('teacher/classes')
  @Roles('teacher')
  getTeacherClasses(@CurrentUser() user: User) {
    return this.academicsService.getTeacherClasses(user.id);
  }

  // Accountant portal
  @Get('all-classes')
  @Roles('accountant')
  getAllClasses(@Query('academic_year_id') yearId: string) {
    return this.academicsService.getAllDistributedClasses(+yearId);
  }
}
