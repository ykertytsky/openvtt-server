import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { db, assets, Asset, NewAsset } from '../db';
import { eq } from 'drizzle-orm';
import { MinIOService } from '../storage/minio.service';
import { MINIO_CONFIG } from '../storage/minio.config';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(private readonly minioService: MinIOService) {}

  generateObjectKey(originalName: string, folder?: string, filename?: string): string {
    const uuid = randomUUID();
    const ext = path.extname(originalName);
    const baseName = filename || path.basename(originalName, ext);
    
    if (folder) {
      return `${folder}/${uuid}-${baseName}${ext}`;
    }
    return `${uuid}-${baseName}${ext}`;
  }

  async createAsset(
    provider: 'local' | 's3',
    objectKey: string,
    mimeType: string,
    size: number,
    worldId: string,
  ): Promise<Asset> {
    try {
      const newAsset: NewAsset = {
        worldId,
        provider,
        objectKey,
        mimeType,
        size,
        createdAt: new Date(),
      };

      const [asset] = await db.insert(assets).values(newAsset).returning();
      this.logger.log(`Asset created: ${asset.id}`);
      return asset as Asset;
    } catch (error) {
      this.logger.error(`Error creating asset`, error);
      throw new InternalServerErrorException('Failed to create asset record');
    }
  }

  async getAsset(assetId: string): Promise<Asset> {
    try {
      const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
      
      if (!asset) {
        throw new NotFoundException(`Asset with ID ${assetId} not found`);
      }

      return asset as Asset;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting asset ${assetId}`, error);
      throw new InternalServerErrorException('Failed to get asset');
    }
  }

  async getAssetPresignedUrl(assetId: string, expiry?: number): Promise<string> {
    const asset = await this.getAsset(assetId);
    return this.minioService.getPresignedUrl(MINIO_CONFIG.bucketName, asset.objectKey, expiry);
  }
}

