import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ScheduleCacheService } from '../../common/cache/schedule-cache.service.js';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';

@Injectable()
export class StaffsService {
  constructor(
    private prisma: PrismaService,
    private scheduleCache: ScheduleCacheService,
    private cloudinary: CloudinaryService,
  ) {}

  async getAll() {
    const staffs = await this.prisma.staff.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });
    return staffs.map((s) => this.mapAvatarUrls(s));
  }

  async getOne(id: number) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, isDeleted: false },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return this.mapAvatarUrls(staff);
  }

  async create(dto: CreateStaffDto, file?: Express.Multer.File) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Tên nhân viên không được để trống');
    }

    let avatarPublicId: string | null = null;
    if (file) {
      const result = await this.cloudinary.uploadStream(file.buffer, 'staffs');
      avatarPublicId = result.public_id;
    }

    const staff = await this.prisma.staff.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        avatarUrl: avatarPublicId,
      },
    });

    await this.refreshStaffsCache();
    return staff;
  }

  async update(id: number, dto: UpdateStaffDto, file?: Express.Multer.File) {
    const staff = await this.findActiveOrThrow(id);

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Tên nhân viên không được để trống');
    }

    let avatarPublicId = staff.avatarUrl;
    if (file) {
      const result = await this.cloudinary.uploadStream(file.buffer, 'staffs');
      if (staff.avatarUrl) await this.cloudinary.deleteImage(staff.avatarUrl);
      avatarPublicId = result.public_id;
    }

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && {
          isActive: String(dto.isActive) === 'true',
        }),
        avatarUrl: avatarPublicId,
      },
    });

    await this.refreshStaffsCache();
    return updated;
  }

  async delete(id: number) {
    const staff = await this.findActiveOrThrow(id);

    const hasUpcomingAppointment = await this.prisma.appointment.findFirst({
      where: {
        staffId: id,
        isDeleted: false,
        status: { in: ['PENDING', 'CONFIRMED'] },
        appointmentStart: { gte: new Date() },
      },
    });

    if (hasUpcomingAppointment) {
      throw new ConflictException(
        'Nhân viên còn lịch hẹn sắp tới, không thể xoá',
      );
    }

    const deleted = await this.prisma.staff.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });

    await this.refreshStaffsCache();
    return deleted;
  }

  // ── Private ───────────────────────────────────────────────────────
  private async findActiveOrThrow(id: number) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, isDeleted: false },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  private mapAvatarUrls(s: any) {
    return {
      ...s,
      avatarUrl: s.avatarUrl
        ? {
            avatar: this.cloudinary.getUrl(s.avatarUrl, 'avatar'),
            thumbnail: this.cloudinary.getUrl(s.avatarUrl, 'thumbnail'),
            profile: this.cloudinary.getUrl(s.avatarUrl, 'profile'),
          }
        : null,
    };
  }

  private async refreshStaffsCache() {
    const activeStaffs = await this.prisma.staff.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, name: true, avatarUrl: true },
      orderBy: { id: 'asc' },
    });
    this.scheduleCache.setActiveStaffs(activeStaffs);
  }
}
