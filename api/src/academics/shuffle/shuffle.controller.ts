import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { User } from '../../entities/user.entity';
import { RunShuffleDto } from './dto/run-shuffle.dto';
import { ShuffleService } from './shuffle.service';

@Controller('api/v1/academics/shuffle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShuffleController {
  constructor(private shuffleService: ShuffleService) {}

  @Post('run')
  @Roles('dean')
  runShuffle(@Body() dto: RunShuffleDto, @CurrentUser() user: User) {
    return this.shuffleService.runShuffle(dto, user.id);
  }

  @Get(':sessionId/preview')
  @Roles('dean', 'principal')
  getPreview(@Param('sessionId') id: string) {
    return this.shuffleService.getPreview(+id);
  }

  @Put(':sessionId/adjust/:resultId')
  @Roles('dean')
  adjustStudent(
    @Param('sessionId') sessionId: string,
    @Param('resultId') resultId: string,
    @Body('new_class_id') newClassId: number,
  ) {
    return this.shuffleService.adjustStudent(+sessionId, +resultId, newClassId);
  }

  @Post(':sessionId/submit')
  @Roles('dean')
  submit(
    @Param('sessionId') sessionId: string,
    @Body('principal_id') principalId: number,
    @CurrentUser() user: User,
  ) {
    return this.shuffleService.submitForApproval(+sessionId, user.id, principalId);
  }

  @Post(':sessionId/approve')
  @Roles('principal')
  approve(
    @Param('sessionId') sessionId: string,
    @Body('dean_id') deanId: number,
    @CurrentUser() user: User,
  ) {
    return this.shuffleService.approve(+sessionId, user.id, deanId);
  }

  @Post(':sessionId/reject')
  @Roles('principal')
  reject(
    @Param('sessionId') sessionId: string,
    @Body('note') note: string,
    @Body('dean_id') deanId: number,
    @CurrentUser() user: User,
  ) {
    return this.shuffleService.reject(+sessionId, user.id, deanId, note);
  }

  @Post(':sessionId/distribute')
  @Roles('dean')
  distribute(
    @Param('sessionId') sessionId: string,
    @Body('accountant_id') accountantId: number,
    @Body('teacher_assignments') teacherAssignments: { class_id: number; teacher_id: number }[],
    @CurrentUser() user: User,
  ) {
    return this.shuffleService.distribute(+sessionId, user.id, accountantId, teacherAssignments ?? []);
  }

  @Get('pending')
  @Roles('principal')
  getPending() {
    return this.shuffleService.getPendingApprovals();
  }
}
