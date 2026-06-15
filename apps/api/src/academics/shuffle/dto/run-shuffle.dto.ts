import { IsEnum, IsNumber } from 'class-validator';

export class RunShuffleDto {
  @IsNumber()
  p_level_id: number;

  @IsNumber()
  academic_year_id: number;

  @IsEnum(['round_robin', 'balanced_bands', 'snake_draft', 'auto_promote'])
  algorithm: string;
}
