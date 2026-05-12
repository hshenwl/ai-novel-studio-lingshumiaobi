import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, MaxLength } from 'class-validator';

export class CreateVolumeDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

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