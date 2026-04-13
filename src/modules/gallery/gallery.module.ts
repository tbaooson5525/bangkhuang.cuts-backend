import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { GalleryPublicController, GalleryAdminController } from './gallery.controller.js';
import { GalleryService } from './gallery.service.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GalleryPublicController, GalleryAdminController],
  providers: [GalleryService],
})
export class GalleryModule {}