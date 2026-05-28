import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  listUsers() { return this.adminService.listUsers(); }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) { return this.adminService.createUser(dto); }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(+id, dto);
  }

  @Delete('users/:id')
  deactivateUser(@Param('id') id: string) { return this.adminService.deactivateUser(+id); }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string) { return this.adminService.resetPassword(+id); }

  @Get('academic-years')
  listAcademicYears() { return this.adminService.listAcademicYears(); }

  @Post('academic-years')
  createAcademicYear(@Body('name') name: string) { return this.adminService.createAcademicYear(name); }

  @Post('academic-years/:id/archive')
  archiveAcademicYear(@Param('id') id: string) { return this.adminService.archiveAcademicYear(+id); }
}
