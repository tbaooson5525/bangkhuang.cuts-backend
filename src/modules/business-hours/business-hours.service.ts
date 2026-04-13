import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleCacheService } from '../../common/cache/schedule-cache.service.js';
import {
  UpdateBusinessHoursDto,
  SetWorkingDaysDto,
  CreateDayOffDto,
} from './dto/update-business-hours.dto.js';

@Injectable()
export class BusinessHoursService {
  constructor(
    private prisma: PrismaService,
    private scheduleCache: ScheduleCacheService,
  ) {}

  // ── Business Hours ──────────────────────────────────────────────

  getBusinessHours() {
    return this.prisma.businessHours.findFirst();
  }

  async updateBusinessHours(dto: UpdateBusinessHoursDto) {
    if (dto.openTime && dto.closeTime && dto.openTime >= dto.closeTime) {
      throw new BadRequestException('Giờ mở cửa phải trước giờ đóng cửa');
    }
    if (dto.slotDuration && dto.slotDuration < 15) {
      throw new BadRequestException('Slot duration tối thiểu 15 phút');
    }

    const updated = await this.prisma.businessHours.upsert({
      where: { singleton: 'singleton' },
      update: dto,
      create: {
        openTime: dto.openTime ?? '08:00',
        closeTime: dto.closeTime ?? '20:00',
        slotDuration: dto.slotDuration ?? 60,
      },
    });

    this.scheduleCache.setSlots(
      updated.openTime,
      updated.closeTime,
      updated.slotDuration,
    );

    return updated;
  }

  // ── Working Days ────────────────────────────────────────────────

  getWorkingDays() {
    return this.prisma.workingDay.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async setWorkingDays(dto: SetWorkingDaysDto) {
    const valid = dto.dayOfWeek.every((d) => d >= 0 && d <= 6);
    if (!valid) {
      throw new BadRequestException('dayOfWeek phải từ 0 (CN) đến 6 (T7)');
    }
    if (dto.dayOfWeek.length === 0) {
      throw new BadRequestException('Phải có ít nhất 1 ngày làm việc');
    }

    await this.prisma.workingDay.deleteMany();
    const result = await this.prisma.workingDay.createMany({
      data: dto.dayOfWeek.map((d) => ({ dayOfWeek: d })),
    });

    this.scheduleCache.setWorkingDays(dto.dayOfWeek);

    return result;
  }

  // ── Days Off ────────────────────────────────────────────────────

  getDaysOff() {
    return this.prisma.dayOff.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async createDayOff(dto: CreateDayOffDto) {
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    const existing = await this.prisma.dayOff.findUnique({ where: { date } });
    if (existing) {
      throw new ConflictException('Ngày này đã được thêm vào danh sách nghỉ');
    }

    const dayOff = await this.prisma.dayOff.create({
      data: { date, reason: dto.reason },
    });

    this.scheduleCache.addDayOff(date);

    return dayOff;
  }

  async deleteDayOff(dateStr: string) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    const existing = await this.prisma.dayOff.findUnique({ where: { date } });
    if (!existing) throw new NotFoundException('Ngày nghỉ không tồn tại');

    const deleted = await this.prisma.dayOff.delete({ where: { date } });

    this.scheduleCache.removeDayOff(date);

    return deleted;
  }
}
