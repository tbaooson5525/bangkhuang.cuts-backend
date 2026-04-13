import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service.js';
import {
  CreateThemeDto,
  UpdateThemeDto,
  AddImagesDto,
  ReorderImagesDto,
} from './dto/gallery.dto.js';

@Injectable()
export class GalleryService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  // ── Public ──────────────────────────────────────────────────────
  async getPublicGallery() {
    const themes = await this.prisma.galleryTheme.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        images: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      slug: theme.slug,
      images: theme.images.map((img) => ({
        id: img.id,
        thumbnailUrl: this.cloudinary.getUrl(img.publicId, 'galleryThumb'),
        fullUrl: this.cloudinary.getUrl(img.publicId, 'galleryFull'),
      })),
    }));
  }

  // ── Admin — Signature ───────────────────────────────────────────
  getUploadSignature(folder: 'gallery' | 'staffs') {
    return this.cloudinary.generateSignature(folder);
  }

  // ── Admin — Themes ──────────────────────────────────────────────
  getThemes() {
    return this.prisma.galleryTheme.findMany({
      orderBy: { order: 'asc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async createTheme(dto: CreateThemeDto) {
    const existing = await this.prisma.galleryTheme.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new BadRequestException('Slug đã tồn tại');

    return this.prisma.galleryTheme.create({ data: dto });
  }

  async updateTheme(id: number, dto: UpdateThemeDto) {
    const theme = await this.prisma.galleryTheme.findUnique({ where: { id } });
    if (!theme) throw new NotFoundException('Theme không tồn tại');

    if (dto.slug && dto.slug !== theme.slug) {
      const existing = await this.prisma.galleryTheme.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) throw new BadRequestException('Slug đã tồn tại');
    }

    return this.prisma.galleryTheme.update({ where: { id }, data: dto });
  }

  async deleteTheme(id: number) {
    const theme = await this.prisma.galleryTheme.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!theme) throw new NotFoundException('Theme không tồn tại');

    // Xóa ảnh trên Cloudinary trước
    await Promise.all(
      theme.images.map((img) => this.cloudinary.deleteImage(img.publicId)),
    );

    // Cascade delete trong DB
    return this.prisma.galleryTheme.delete({ where: { id } });
  }

  // ── Admin — Images ──────────────────────────────────────────────
  async addImages(dto: AddImagesDto) {
    const theme = await this.prisma.galleryTheme.findUnique({
      where: { id: dto.themeId },
    });
    if (!theme) throw new NotFoundException('Theme không tồn tại');

    // Lấy order hiện tại cao nhất trong theme
    const lastImage = await this.prisma.galleryImage.findFirst({
      where: { themeId: dto.themeId },
      orderBy: { order: 'desc' },
    });
    const startOrder = (lastImage?.order ?? -1) + 1;

    return this.prisma.galleryImage.createMany({
      data: dto.publicIds.map((publicId, i) => ({
        themeId: dto.themeId,
        publicId,
        order: startOrder + i,
      })),
    });
  }

  async deleteImage(id: number) {
    const image = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Ảnh không tồn tại');

    await this.cloudinary.deleteImage(image.publicId);
    return this.prisma.galleryImage.delete({ where: { id } });
  }

  async reorderImages(dto: ReorderImagesDto) {
    await Promise.all(
      dto.images.map(({ id, order }) =>
        this.prisma.galleryImage.update({
          where: { id },
          data: { order },
        }),
      ),
    );
    return { message: 'Reordered successfully' };
  }
}
