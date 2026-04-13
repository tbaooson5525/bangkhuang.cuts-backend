import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Controller('bookings')
export class BookingController {
  constructor(private bookingService: BookingService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }
}
