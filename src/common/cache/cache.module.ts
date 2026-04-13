import { Global, Module } from '@nestjs/common';
import { ScheduleCacheService } from './schedule-cache.service.js';

@Global()
@Module({
  providers: [ScheduleCacheService],
  exports: [ScheduleCacheService],
})
export class CacheModule {}
