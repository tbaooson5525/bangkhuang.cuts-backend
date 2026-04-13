import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  Matches,
  IsDateString,
} from 'class-validator';

export class CreateBookingDto {
  @IsDateString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'slot phải có định dạng HH:MM' })
  slot: string; // HH:MM

  @IsInt()
  staffId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  serviceIds: number[];

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
