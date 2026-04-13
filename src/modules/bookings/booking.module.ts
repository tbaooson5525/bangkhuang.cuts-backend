import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BookingController } from './booking.controller.js';
import { AdminBookingController } from './admin-booking.controller.js';
import { BookingService } from './booking.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BookingController, AdminBookingController],
  providers: [BookingService],
})
export class BookingModule {}
