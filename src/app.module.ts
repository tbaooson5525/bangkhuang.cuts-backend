import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { StaffsModule } from './modules/staffs/staffs.module.js';
import { BusinessHoursModule } from './modules/business-hours/business-hours.module.js';
import { AvailabilityModule } from './modules/availability/availability.module.js';
import { ScheduleCacheService } from './common/cache/schedule-cache.service.js';
import { PrismaService } from './database/prisma.service.js';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CacheModule } from './common/cache/cache.module.js';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module.js';
import { GalleryModule } from './modules/gallery/gallery.module.js';
import { BookingModule } from './modules/bookings/booking.module.js';
import { ServicesModule } from './modules/services/services.module.js';
import { CleanupModule } from './common/cleanup/cleanup.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CloudinaryModule,
    CacheModule,
    AuthModule,
    StaffsModule,
    BusinessHoursModule,
    AvailabilityModule,
    GalleryModule,
    BookingModule,
    ServicesModule,
    CleanupModule,
  ],
  providers: [PrismaService],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(
    private scheduleCache: ScheduleCacheService,
    private prisma: PrismaService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }

  async onModuleInit() {
    const [businessHours, workingDays, daysOff, activeStaffs] =
      await Promise.all([
        this.prisma.businessHours.findFirst(),
        this.prisma.workingDay.findMany(),
        this.prisma.dayOff.findMany(),
        this.prisma.staff.findMany({
          where: { isActive: true },
          select: { id: true, name: true, avatarUrl: true },
          orderBy: { id: 'asc' },
        }),
      ]);

    if (businessHours) {
      this.scheduleCache.setSlots(
        businessHours.openTime,
        businessHours.closeTime,
        businessHours.slotDuration,
      );
    }

    this.scheduleCache.setWorkingDays(workingDays.map((w) => w.dayOfWeek));

    for (const dayOff of daysOff) {
      this.scheduleCache.addDayOff(dayOff.date);
    }

    this.scheduleCache.setActiveStaffs(
      activeStaffs.map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
      })),
    );
  }
}
