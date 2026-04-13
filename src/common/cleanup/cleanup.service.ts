import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  // ── Auto DONE: chạy mỗi 5 phút ─────────────────────────────────
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoMarkDone() {
    const result = await this.prisma.appointment.updateMany({
      where: {
        status: 'CONFIRMED',
        isDeleted: false,
        appointmentStart: { lt: new Date() },
      },
      data: { status: 'DONE' },
    });

    if (result.count > 0) {
      this.logger.log(`Auto DONE: ${result.count} appointments`);
    }
  }

  // ── Hard delete: chạy mỗi ngày lúc 2:00 AM ───────────────────────
  @Cron('0 2 * * *')
  async hardDelete() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Hard delete appointments sau 12 tháng từ appointmentStart
    const appointments = await this.prisma.appointment.deleteMany({
      where: {
        appointmentStart: { lt: twelveMonthsAgo },
      },
    });

    // Hard delete staffs sau 12 tháng từ deletedAt
    const staffs = await this.prisma.staff.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: twelveMonthsAgo },
      },
    });

    // Hard delete services sau 12 tháng từ deletedAt
    const services = await this.prisma.service.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: twelveMonthsAgo },
      },
    });

    this.logger.log(
      `Hard delete: ${appointments.count} appointments, ${staffs.count} staffs, ${services.count} services`,
    );
  }
}
