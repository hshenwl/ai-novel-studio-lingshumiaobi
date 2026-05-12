import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, MaxLength, IsEnum } from 'class-validator';

export class CreateChapterDto {
  @IsUUID()
  @IsNotEmpty()
  volumeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  outline?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}