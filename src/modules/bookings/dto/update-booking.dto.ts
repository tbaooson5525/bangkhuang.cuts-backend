import {
  IsString,
  IsInt,
  IsArray,
  IsOptional,
  Matches,
  IsDateString,
} from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'slot phải có định dạng HH:MM' })
  slot?: string;

  @IsOptional()
  @IsInt()
  staffId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  serviceIds?: number[];

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
