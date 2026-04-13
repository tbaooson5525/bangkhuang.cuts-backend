import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';
import { CookieGuard } from '../auth/guards/cookie.guard.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';

@Controller('admin/bookings')
@UseGuards(CookieGuard)
export class AdminBookingController {
  constructor(private bookingService: BookingService) {}

  @Get()
  getAll(@Query('status') status?: string) {
    return this.bookingService.getAll(status);
  }

  @Post()
  @HttpCode(201)
  adminCreate(@Body() dto: CreateBookingDto) {
    return this.bookingService.adminCreate(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookingDto) {
    return this.bookingService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.bookingService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(200)
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.softDelete(id);
  }
}
