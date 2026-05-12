import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class GenerateTextDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsOptional()
  model?: string;

  @IsArray()
  @IsOptional()
  stopSequences?: string[];
}