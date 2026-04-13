import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { BusinessHoursModule } from '../business-hours/business-hours.module.js';
import { AvailabilityController } from './availability.controller.js';
import { AvailabilityService } from './availability.service.js';

@Module({
  imports: [DatabaseModule, BusinessHoursModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}
