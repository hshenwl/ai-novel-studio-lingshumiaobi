import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('steps')
  getSteps() {
    return this.workflowService.getSteps();
  }

  @Get('project/:projectId')
  getProjectWorkflow(@Param('projectId') projectId: string) {
    return this.workflowService.getProjectWorkflow(projectId);
  }

  @Post('execute/:step')
  executeStep(@Param('step') step: string, @Body() executeDto: ExecuteWorkflowDto) {
    return this.workflowService.executeStep(step, executeDto);
  }

  @Put('project/:projectId/step/:step')
  updateStepStatus(
    @Param('projectId') projectId: string,
    @Param('step') step: string,
    @Body('status') status: string,
  ) {
    return this.workflowService.updateStepStatus(projectId, step, status);
  }
}