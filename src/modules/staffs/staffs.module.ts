import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { StaffsController } from './staffs.controller.js';
import { StaffsService } from './staffs.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [StaffsController],
  providers: [StaffsService],
  exports: [StaffsService],
})
export class StaffsModule {}
