import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsEnum } from 'class-validator';

export class CreateForeshadowDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsOptional()
  chapterId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  expectedResolution?: string;

  @IsEnum(['active', 'resolved', 'abandoned'])
  @IsOptional()
  status?: string;
}