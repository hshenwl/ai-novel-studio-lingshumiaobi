import { IsOptional, IsString } from 'class-validator';

export class QueryKnowledgeDto {
  @IsOptional()
  @IsString()
  category?: string;
}