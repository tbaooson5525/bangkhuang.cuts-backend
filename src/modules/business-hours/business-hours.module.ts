import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BusinessHoursController } from './business-hours.controller.js';
import { BusinessHoursService } from './business-hours.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BusinessHoursController],
  providers: [BusinessHoursService],
  exports: [BusinessHoursService],
})
export class BusinessHoursModule {}
