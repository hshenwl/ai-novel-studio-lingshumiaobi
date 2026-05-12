import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateRelationshipDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsNotEmpty()
  sourceCharacterId: string;

  @IsUUID()
  @IsNotEmpty()
  targetCharacterId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  evolution?: string;
}