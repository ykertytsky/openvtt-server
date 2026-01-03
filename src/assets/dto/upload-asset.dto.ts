import { IsString, IsOptional, MaxLength, IsUUID, IsNotEmpty } from 'class-validator';

export class UploadAssetDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  folder?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  filename?: string;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}

