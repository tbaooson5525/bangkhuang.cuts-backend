export class UpdateBusinessHoursDto {
  openTime?: string;
  closeTime?: string;
  slotDuration?: number;
}

export class SetWorkingDaysDto {
  dayOfWeek: number[];
}

export class CreateDayOffDto {
  date: string;
  reason?: string;
}
