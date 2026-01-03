import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { MinIOService } from '../storage/minio.service';
import { MINIO_CONFIG } from '../storage/minio.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  private readonly logger = new Logger(AssetsController.name);

  constructor(
    private readonly assetsService: AssetsService,
    private readonly minioService: MinIOService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadAssetDto,
  ) {
    this.logger.log(`[UPLOAD] Received upload request`);
    this.logger.log(`[UPLOAD] File present: ${!!file}`);

    if (!file) {
      this.logger.error(`[UPLOAD] No file provided in request`);
      throw new BadRequestException('File is required');
    }

    this.logger.log(`[UPLOAD] File details: name=${file.originalname}, size=${file.size}, mimeType=${file.mimetype}`);

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.logger.error(`[UPLOAD] File size ${file.size} exceeds limit ${maxSize}`);
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Validate mime type (images only)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.error(`[UPLOAD] Invalid mime type: ${file.mimetype}`);
      throw new BadRequestException('Only image files are allowed');
    }

    // Generate object key - include worldId in folder path
    const folderPath = uploadDto.folder 
      ? `${uploadDto.folder}/${uploadDto.worldId}`
      : `worlds/${uploadDto.worldId}`;
    const objectKey = this.assetsService.generateObjectKey(
      file.originalname,
      folderPath,
      uploadDto.filename,
    );
    this.logger.log(`[UPLOAD] Generated object key: ${objectKey}`);

    // Upload to MinIO
    this.logger.log(`[UPLOAD] Uploading to MinIO bucket: ${MINIO_CONFIG.bucketName}`);
    await this.minioService.uploadFile(
      MINIO_CONFIG.bucketName,
      objectKey,
      file.buffer,
      file.mimetype,
    );
    this.logger.log(`[UPLOAD] MinIO upload completed`);

    // Create asset record
    this.logger.log(`[UPLOAD] Creating asset record in database`);
    const asset = await this.assetsService.createAsset(
      's3',
      objectKey,
      file.mimetype,
      file.size,
      uploadDto.worldId,
    );
    this.logger.log(`[UPLOAD] Asset created with ID: ${asset.id}`);

    // Generate presigned URL
    const presignedUrl = await this.minioService.getPresignedUrl(
      MINIO_CONFIG.bucketName,
      objectKey,
    );
    this.logger.log(`[UPLOAD] Generated presigned URL`);

    return {
      assetId: asset.id,
      presignedUrl,
      objectKey,
    };
  }

  @Get(':id/url')
  async getAssetUrl(@Param('id') id: string) {
    const presignedUrl = await this.assetsService.getAssetPresignedUrl(id);
    return { presignedUrl };
  }

  @Get(':id')
  async getAsset(@Param('id') id: string) {
    const asset = await this.assetsService.getAsset(id);
    return asset;
  }
}

