import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'DONE', 'CANCELLED'], {
    message: 'Status không hợp lệ',
  })
  status: string;
}
