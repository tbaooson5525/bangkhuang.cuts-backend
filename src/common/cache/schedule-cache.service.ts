import { Injectable } from '@nestjs/common';

export interface StaffCache {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface ScheduleCache {
  slots: string[];
  workingDays: Set<number>;
  daysOff: Set<string>;
  activeStaffs: StaffCache[];
}

@Injectable()
export class ScheduleCacheService {
  private cache: ScheduleCache = {
    slots: [],
    workingDays: new Set(),
    daysOff: new Set(),
    activeStaffs: [],
  };

  get(): ScheduleCache {
    return this.cache;
  }

  setSlots(openTime: string, closeTime: string, slotDuration: number): void {
    this.cache = {
      ...this.cache,
      slots: this.generateSlots(openTime, closeTime, slotDuration),
    };
  }

  setWorkingDays(dayOfWeek: number[]): void {
    this.cache = { ...this.cache, workingDays: new Set(dayOfWeek) };
  }

  setActiveStaffs(staffs: StaffCache[]): void {
    this.cache = { ...this.cache, activeStaffs: staffs };
  }

  addDayOff(date: Date): void {
    const daysOff = new Set([...this.cache.daysOff, this.toDateKey(date)]);
    this.cache = { ...this.cache, daysOff };
  }

  removeDayOff(date: Date): void {
    const daysOff = new Set(this.cache.daysOff);
    daysOff.delete(this.toDateKey(date));
    this.cache = { ...this.cache, daysOff };
  }

  private generateSlots(
    openTime: string,
    closeTime: string,
    slotDuration: number,
  ): string[] {
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    const slots: string[] = [];
    for (let min = openMinutes; min < closeMinutes; min += slotDuration) {
      const h = Math.floor(min / 60)
        .toString()
        .padStart(2, '0');
      const m = (min % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }

  toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
