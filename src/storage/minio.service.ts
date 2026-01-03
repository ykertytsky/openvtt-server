import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { minioClient, MINIO_CONFIG } from './minio.config';
import * as MinIO from 'minio';

@Injectable()
export class MinIOService {
  private readonly logger = new Logger(MinIOService.name);

  async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await minioClient.bucketExists(MINIO_CONFIG.bucketName);
      
      if (!bucketExists) {
        this.logger.log(`Creating bucket: ${MINIO_CONFIG.bucketName}`);
        await minioClient.makeBucket(MINIO_CONFIG.bucketName, 'us-east-1');
        this.logger.log(`Bucket ${MINIO_CONFIG.bucketName} created successfully`);
      } else {
        this.logger.log(`Bucket ${MINIO_CONFIG.bucketName} already exists`);
      }
    } catch (error) {
      this.logger.error(`Error initializing bucket: ${MINIO_CONFIG.bucketName}`, error);
      throw new InternalServerErrorException('Failed to initialize MinIO bucket');
    }
  }

  async uploadFile(
    bucket: string,
    objectKey: string,
    file: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      this.logger.log(`Uploading file to ${bucket}/${objectKey}`);
      await minioClient.putObject(bucket, objectKey, file, file.length, {
        'Content-Type': mimeType,
      });
      this.logger.log(`File uploaded successfully: ${bucket}/${objectKey}`);
    } catch (error) {
      this.logger.error(`Error uploading file to ${bucket}/${objectKey}`, error);
      throw new InternalServerErrorException('Failed to upload file to MinIO');
    }
  }

  async getPresignedUrl(
    bucket: string,
    objectKey: string,
    expiry: number = 7 * 24 * 60 * 60, // 7 days in seconds
  ): Promise<string> {
    try {
      const url = await minioClient.presignedGetObject(bucket, objectKey, expiry);
      return url;
    } catch (error) {
      this.logger.error(`Error generating presigned URL for ${bucket}/${objectKey}`, error);
      throw new InternalServerErrorException('Failed to generate presigned URL');
    }
  }

  async deleteFile(bucket: string, objectKey: string): Promise<void> {
    try {
      this.logger.log(`Deleting file: ${bucket}/${objectKey}`);
      await minioClient.removeObject(bucket, objectKey);
      this.logger.log(`File deleted successfully: ${bucket}/${objectKey}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${bucket}/${objectKey}`, error);
      throw new InternalServerErrorException('Failed to delete file from MinIO');
    }
  }
}

