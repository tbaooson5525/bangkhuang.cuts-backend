import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  Query,
} from '@nestjs/common';
import { GalleryService } from './gallery.service.js';
import {
  CreateThemeDto,
  UpdateThemeDto,
  AddImagesDto,
  ReorderImagesDto,
} from './dto/gallery.dto.js';
import { CookieGuard } from '../auth/guards/cookie.guard.js';

// ── Public ──────────────────────────────────────────────────────
@Controller('gallery')
export class GalleryPublicController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  getPublicGallery() {
    return this.galleryService.getPublicGallery();
  }
}

// ── Admin ────────────────────────────────────────────────────────
@Controller('admin/gallery')
@UseGuards(CookieGuard)
export class GalleryAdminController {
  constructor(private galleryService: GalleryService) {}

  // Signature để FE upload thẳng lên Cloudinary
  @Get('sign')
  getUploadSignature(@Query('folder') folder: 'gallery' | 'staffs') {
    return this.galleryService.getUploadSignature(folder || 'gallery');
  }

  // Themes
  @Get('themes')
  getThemes() {
    return this.galleryService.getThemes();
  }

  @Post('themes')
  createTheme(@Body() dto: CreateThemeDto) {
    return this.galleryService.createTheme(dto);
  }

  @Patch('themes/:id')
  updateTheme(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateThemeDto,
  ) {
    return this.galleryService.updateTheme(id, dto);
  }

  @Delete('themes/:id')
  @HttpCode(200)
  deleteTheme(@Param('id', ParseIntPipe) id: number) {
    return this.galleryService.deleteTheme(id);
  }

  // Images
  @Post('images')
  addImages(@Body() dto: AddImagesDto) {
    return this.galleryService.addImages(dto);
  }

  @Delete('images/:id')
  @HttpCode(200)
  deleteImage(@Param('id', ParseIntPipe) id: number) {
    return this.galleryService.deleteImage(id);
  }

  @Patch('images/reorder')
  reorderImages(@Body() dto: ReorderImagesDto) {
    return this.galleryService.reorderImages(dto);
  }
}
