import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, IsUUID } from 'class-validator';

export class CreateWorldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  systemId?: number;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;

  @IsString()
  @IsUUID()
  @IsOptional()
  coverImageId?: string;
}
