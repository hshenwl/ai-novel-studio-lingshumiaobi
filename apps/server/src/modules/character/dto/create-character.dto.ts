import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsEnum, IsNumber } from 'class-validator';

export class CreateCharacterDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsEnum(['protagonist', 'major', 'minor'])
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  personality?: string;

  @IsString()
  @IsOptional()
  background?: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsUUID()
  @IsOptional()
  professionId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}