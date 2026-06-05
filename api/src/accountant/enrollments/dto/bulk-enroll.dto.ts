import { ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class BulkEnrollDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  student_ids: number[];

  @IsEnum(['feeding', 'transport'])
  type: 'feeding' | 'transport';

  @IsOptional()
  @IsEnum(['breakfast', 'lunch', 'both'])
  meal_type?: 'breakfast' | 'lunch' | 'both';

  @IsOptional()
  @IsNumber()
  zone_id?: number;

  @IsDateString()
  payment_date: string;

  @IsNumber()
  duration_days: number;
}
