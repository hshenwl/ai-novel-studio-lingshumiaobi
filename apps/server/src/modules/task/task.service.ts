import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        id: uuidv4(),
        ...createDto,
        status: 'pending',
        progress: 0,
      },
    });

    // TODO: 将任务加入队列处理
    this.logger.log(`Task created: ${task.id}`);

    return task;
  }

  async findAll() {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`任务 #${id} 不存在`);
    return task;
  }

  async update(id: string, updateDto: UpdateTaskDto) {
    await this.findOne(id);
    return this.prisma.task.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async cancel(id: string) {
    const task = await this.findOne(id);
    if (task.status === 'completed') {
      throw new Error('无法取消已完成的任务');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async retry(id: string) {
    const task = await this.findOne(id);

    if (task.status !== 'failed') {
      throw new Error('只能重试失败的任务');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: 'pending', progress: 0, error: null },
    });
  }
}