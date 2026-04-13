import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleCacheService } from '../../common/cache/schedule-cache.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingDto } from './dto/update-booking.dto.js';

// ── Status transition map ─────────────────────────────────────────
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DONE', 'CANCELLED'],
  DONE: ['CANCELLED'],
  CANCELLED: [],
};

const APPOINTMENT_INCLUDE = {
  staff: { select: { id: true, name: true } },
  appointmentServices: {
    include: {
      service: { select: { id: true, name: true, price: true } },
    },
  },
} as const;

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private scheduleCache: ScheduleCacheService,
  ) {}

  // ── Public ────────────────────────────────────────────────────────
  async create(dto: CreateBookingDto) {
    return this.createAppointment(dto, true);
  }

  // ── Admin ─────────────────────────────────────────────────────────
  async adminCreate(dto: CreateBookingDto) {
    return this.createAppointment(dto, false);
  }

  async getAll(status?: string) {
    return this.prisma.appointment.findMany({
      where: {
        isDeleted: false,
        ...(status && { status: status as any }),
      },
      orderBy: { appointmentStart: 'desc' },
      include: APPOINTMENT_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateBookingDto) {
    const appointment = await this.findActiveOrThrow(id);
    if (appointment.status === 'CANCELLED') {
      throw new ConflictException('Không thể sửa lịch đã huỷ');
    }

    const cache = this.scheduleCache.get();
    const currentSlot = this.toTimeString(appointment.appointmentStart);
    const newDate = dto.date
      ? new Date(dto.date)
      : appointment.appointmentStart;
    const newSlot = dto.slot ?? currentSlot;

    let appointmentStart = appointment.appointmentStart;
    if (dto.date || dto.slot) {
      if (!cache.slots.includes(newSlot)) {
        throw new BadRequestException('Slot không hợp lệ');
      }
      const [h, m] = newSlot.split(':').map(Number);
      appointmentStart = new Date(newDate);
      appointmentStart.setHours(h, m, 0, 0);
    }

    const newStaffId = dto.staffId ?? appointment.staffId;
    if (dto.staffId || dto.date || dto.slot) {
      await this.checkConflict(newStaffId, appointmentStart, id);
    }

    const updateData: any = {
      ...(dto.customerName && { customerName: dto.customerName }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.staffId && { staffId: dto.staffId }),
      appointmentStart,
    };

    if (dto.serviceIds) {
      await this.validateServices(dto.serviceIds);
      updateData.appointmentServices = {
        deleteMany: {},
        create: dto.serviceIds.map((serviceId) => ({ serviceId })),
      };
    }

    return this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: APPOINTMENT_INCLUDE,
    });
  }

  async updateStatus(id: number, newStatus: string) {
    const appointment = await this.findActiveOrThrow(id);
    const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new ConflictException(
        `Không thể chuyển từ ${appointment.status} sang ${newStatus}`,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: newStatus as any },
    });
  }

  async softDelete(id: number) {
    await this.findActiveOrThrow(id);
    return this.prisma.appointment.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // ── Private ───────────────────────────────────────────────────────
  private async createAppointment(dto: CreateBookingDto, checkPast: boolean) {
    const cache = this.scheduleCache.get();

    const date = new Date(dto.date);
    if (isNaN(date.getTime()))
      throw new BadRequestException('Ngày không hợp lệ');

    if (!cache.workingDays.has(date.getDay())) {
      throw new BadRequestException('Ngày này không làm việc');
    }

    if (cache.daysOff.has(this.scheduleCache.toDateKey(date))) {
      throw new BadRequestException('Ngày này đã nghỉ');
    }

    if (!cache.slots.includes(dto.slot)) {
      throw new BadRequestException('Slot không hợp lệ');
    }

    const [h, m] = dto.slot.split(':').map(Number);
    const appointmentStart = new Date(date);
    appointmentStart.setHours(h, m, 0, 0);

    if (checkPast && appointmentStart <= new Date()) {
      throw new BadRequestException('Không thể đặt lịch trong quá khứ');
    }

    if (!cache.activeStaffs.find((s) => s.id === dto.staffId)) {
      throw new BadRequestException(
        'Nhân viên không tồn tại hoặc không hoạt động',
      );
    }

    await this.checkConflict(dto.staffId, appointmentStart);
    await this.validateServices(dto.serviceIds);

    return this.prisma.appointment.create({
      data: {
        customerName: dto.customerName,
        phone: dto.phone,
        staffId: dto.staffId,
        appointmentStart,
        appointmentServices: {
          create: dto.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: APPOINTMENT_INCLUDE,
    });
  }

  private async findActiveOrThrow(id: number) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, isDeleted: false },
    });
    if (!appointment) throw new NotFoundException('Lịch hẹn không tồn tại');
    return appointment;
  }

  private async checkConflict(
    staffId: number,
    appointmentStart: Date,
    excludeId?: number,
  ) {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        staffId,
        appointmentStart,
        isDeleted: false,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    if (conflict)
      throw new ConflictException(
        'Slot này đã được đặt, vui lòng chọn slot khác',
      );
  }

  private async validateServices(serviceIds: number[]) {
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true, isDeleted: false },
    });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Một hoặc nhiều dịch vụ không hợp lệ');
    }
  }

  private toTimeString(date: Date): string {
    return [
      date.getHours().toString().padStart(2, '0'),
      date.getMinutes().toString().padStart(2, '0'),
    ].join(':');
  }
}
