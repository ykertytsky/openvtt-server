import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MinIOService } from './minio.service';

@Module({
  providers: [MinIOService],
  exports: [MinIOService],
})
export class StorageModule implements OnModuleInit {
  private readonly logger = new Logger(StorageModule.name);

  constructor(private readonly minioService: MinIOService) {}

  async onModuleInit() {
    this.logger.log('[INIT] StorageModule initializing...');
    try {
      await this.minioService.initializeBucket();
      this.logger.log('[INIT] StorageModule initialized successfully');
    } catch (error) {
      this.logger.error('[INIT] Failed to initialize StorageModule:', error);
      throw error;
    }
  }
}

