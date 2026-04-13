import {
  IsString,
  IsInt,
  IsPositive,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
