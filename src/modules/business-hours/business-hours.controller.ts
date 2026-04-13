import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { BusinessHoursService } from './business-hours.service.js';
import {
  UpdateBusinessHoursDto,
  SetWorkingDaysDto,
  CreateDayOffDto,
} from './dto/update-business-hours.dto.js';
import { CookieGuard } from '../auth/guards/cookie.guard.js';

@Controller('admin')
@UseGuards(CookieGuard)
export class BusinessHoursController {
  constructor(private businessHoursService: BusinessHoursService) {}

  // ── Business Hours ──────────────────────────────────────

  @Get('business-hours')
  getBusinessHours() {
    return this.businessHoursService.getBusinessHours();
  }

  @Patch('business-hours')
  updateBusinessHours(@Body() dto: UpdateBusinessHoursDto) {
    return this.businessHoursService.updateBusinessHours(dto);
  }

  // ── Working Days ────────────────────────────────────────

  @Get('working-days')
  getWorkingDays() {
    return this.businessHoursService.getWorkingDays();
  }

  @Put('working-days')
  setWorkingDays(@Body() dto: SetWorkingDaysDto) {
    return this.businessHoursService.setWorkingDays(dto);
  }

  // ── Days Off ────────────────────────────────────────────

  @Get('days-off')
  getDaysOff() {
    return this.businessHoursService.getDaysOff();
  }

  @Post('days-off')
  createDayOff(@Body() dto: CreateDayOffDto) {
    return this.businessHoursService.createDayOff(dto);
  }

  @Delete('days-off/:date')
  @HttpCode(200)
  deleteDayOff(@Param('date') date: string) {
    return this.businessHoursService.deleteDayOff(date);
  }
}
