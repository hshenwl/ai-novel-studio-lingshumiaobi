import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExecuteWorkflowDto } from './dto/execute-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  // 七步工作流定义
  private readonly steps = [
    { key: 'concept', name: '核心创意', description: '确定小说的核心创意和主题' },
    { key: 'world-building', name: '世界观设定', description: '构建故事发生的世界的规则和背景' },
    { key: 'character-design', name: '角色设计', description: '设计主要角色和配角' },
    { key: 'plot-outline', name: '情节大纲', description: '规划故事的主要情节线' },
    { key: 'volume-outline', name: '卷纲', description: '按卷规划章节大纲' },
    { key: 'chapter-draft', name: '章节撰写', description: '撰写章节正文' },
    { key: 'revision', name: '修订润色', description: '检查并优化已写内容' },
  ];

  getSteps() {
    return this.steps;
  }

  async getProjectWorkflow(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`项目 #${projectId} 不存在`);
    }

    // 返回项目的工作流状态
    // TODO: 从数据库获取实际的工作流状态
    return this.steps.map(step => ({
      ...step,
      status: 'pending',
      completedAt: null,
    }));
  }

  async executeStep(step: string, executeDto: ExecuteWorkflowDto) {
    // TODO: 实现工作流步骤执行逻辑
    // 这里需要根据不同的step调用不同的AI生成逻辑
    return {
      message: `执行工作流步骤: ${step}`,
      step,
      projectId: executeDto.projectId,
    };
  }

  async updateStepStatus(projectId: string, step: string, status: string) {
    // TODO: 更新工作流步骤状态
    return {
      message: '更新步骤状态',
      projectId,
      step,
      status,
    };
  }
}