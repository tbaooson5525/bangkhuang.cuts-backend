import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleCacheService } from '../../common/cache/schedule-cache.service.js';

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private scheduleCache: ScheduleCacheService,
  ) {}

  async getAvailability(dateStr: string) {
    // ── 1. Validate date ──────────────────────────────────────────
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    const cache = this.scheduleCache.get();

    // ── 2. Check working day ──────────────────────────────────────
    const dayOfWeek = date.getDay();
    if (!cache.workingDays.has(dayOfWeek)) {
      return { date: dateStr, isWorkingDay: false, staffs: [], slots: [] };
    }

    // ── 3. Check day off ──────────────────────────────────────────
    const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    if (cache.daysOff.has(dateKey)) {
      return { date: dateStr, isWorkingDay: false, staffs: [], slots: [] };
    }

    // ── 4. Check active staffs ────────────────────────────────────
    if (cache.activeStaffs.length === 0) {
      return { date: dateStr, isWorkingDay: true, staffs: [], slots: [] };
    }

    // ── 5. Query duy nhất: appointments của ngày đó ───────────────
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentStart: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { staffId: true, appointmentStart: true },
    });

    // ── 6. Tính availability trong memory ─────────────────────────
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Group booked staffIds theo slot time "HH:MM"
    const bookedMap = new Map<string, Set<number>>();
    for (const appt of appointments) {
      const h = appt.appointmentStart.getHours().toString().padStart(2, '0');
      const m = appt.appointmentStart.getMinutes().toString().padStart(2, '0');
      const key = `${h}:${m}`;
      if (!bookedMap.has(key)) bookedMap.set(key, new Set());
      bookedMap.get(key)!.add(appt.staffId);
    }

    const slots: { time: string; availableStaffIds: number[] }[] = [];
    for (const slotTime of cache.slots) {
      // Bỏ qua slot đã qua nếu là hôm nay
      if (isToday) {
        const [h, m] = slotTime.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(h, m, 0, 0);
        if (slotDate <= now) continue;
      }

      const bookedStaffIds = bookedMap.get(slotTime) ?? new Set();
      const availableStaffIds = cache.activeStaffs
        .filter((s) => !bookedStaffIds.has(s.id))
        .map((s) => s.id);

      // Chỉ trả về slot còn ít nhất 1 staff available
      if (availableStaffIds.length > 0) {
        slots.push({ time: slotTime, availableStaffIds });
      }
    }

    return {
      date: dateStr,
      isWorkingDay: true,
      staffs: cache.activeStaffs,
      slots,
    };
  }
}
