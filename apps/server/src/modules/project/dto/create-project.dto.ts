import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(100, { message: '标题最多100个字符' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '简介最多500个字符' })
  description?: string;

  @IsEnum(['fantasy', 'urban', 'scifi', 'history', 'game', 'other'])
  @IsOptional()
  genre?: string;

  @IsNumber()
  @IsOptional()
  targetWordCount?: number;

  @IsString()
  @IsOptional()
  cover?: string;
}