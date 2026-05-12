import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  payload?: string;

  @IsEnum(['low', 'normal', 'high'])
  @IsOptional()
  priority?: string;
}