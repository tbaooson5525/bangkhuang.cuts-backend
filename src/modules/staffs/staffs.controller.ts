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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StaffsService } from './staffs.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { CookieGuard } from '../auth/guards/cookie.guard.js';

@Controller('admin/staffs')
@UseGuards(CookieGuard)
export class StaffsController {
  constructor(private staffsService: StaffsService) {}

  @Get()
  getAll() {
    return this.staffsService.getAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffsService.getOne(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateStaffDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.staffsService.create(dto, file);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.staffsService.update(id, dto, file);
  }

  @Delete(':id')
  @HttpCode(200)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.staffsService.delete(id);
  }
}
