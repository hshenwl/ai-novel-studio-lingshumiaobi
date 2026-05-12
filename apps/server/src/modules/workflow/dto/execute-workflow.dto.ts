import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExecuteWorkflowDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsOptional()
  prompt?: string;
}