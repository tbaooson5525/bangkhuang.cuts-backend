import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service.js';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  getAvailability(@Query('date') date: string) {
    if (!date) throw new BadRequestException('Query param "date" là bắt buộc');
    return this.availabilityService.getAvailability(date);
  }
}
