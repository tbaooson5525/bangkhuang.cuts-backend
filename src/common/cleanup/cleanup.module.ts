import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../database/database.module.js';
import { CleanupService } from './cleanup.service.js';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [CleanupService],
})
export class CleanupModule {}
