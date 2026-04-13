import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.service.findMany({
      where: { isDeleted: false },
      orderBy: { id: 'asc' },
    });
  }

  async getOne(id: number) {
    const service = await this.prisma.service.findFirst({
      where: { id, isDeleted: false },
    });
    if (!service) throw new NotFoundException('Dịch vụ không tồn tại');
    return service;
  }

  async create(dto: CreateServiceDto) {
    const existing = await this.prisma.service.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        isDeleted: false,
      },
    });
    if (existing) throw new ConflictException('Tên dịch vụ đã tồn tại');

    return this.prisma.service.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        price: dto.price,
      },
    });
  }

  async update(id: number, dto: UpdateServiceDto) {
    await this.findActiveOrThrow(id);

    if (dto.name) {
      const existing = await this.prisma.service.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          isDeleted: false,
          id: { not: id },
        },
      });
      if (existing) throw new ConflictException('Tên dịch vụ đã tồn tại');
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async delete(id: number) {
    await this.findActiveOrThrow(id);

    const hasUpcomingAppointment =
      await this.prisma.appointmentService.findFirst({
        where: {
          serviceId: id,
          appointment: {
            isDeleted: false,
            status: { in: ['PENDING', 'CONFIRMED'] },
            appointmentStart: { gte: new Date() },
          },
        },
      });

    if (hasUpcomingAppointment) {
      throw new ConflictException(
        'Dịch vụ đang được dùng trong lịch hẹn sắp tới, không thể xoá',
      );
    }

    return this.prisma.service.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  private async findActiveOrThrow(id: number) {
    const service = await this.prisma.service.findFirst({
      where: { id, isDeleted: false },
    });
    if (!service) throw new NotFoundException('Dịch vụ không tồn tại');
    return service;
  }
}
