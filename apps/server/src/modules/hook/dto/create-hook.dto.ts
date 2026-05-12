import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsEnum } from 'class-validator';

export class CreateHookDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  trigger?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}