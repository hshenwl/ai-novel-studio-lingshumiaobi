import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { QueryKnowledgeDto } from './dto/query-knowledge.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateKnowledgeDto) {
    return this.prisma.knowledge.create({
      data: { id: uuidv4(), ...createDto },
    });
  }

  async findByProject(projectId: string, query: QueryKnowledgeDto) {
    const { category } = query;
    const where: any = { projectId };
    if (category) where.category = category;

    return this.prisma.knowledge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(projectId: string, keyword: string) {
    return this.prisma.knowledge.findMany({
      where: {
        projectId,
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      },
    });
  }

  async findOne(id: string) {
    const knowledge = await this.prisma.knowledge.findUnique({ where: { id } });
    if (!knowledge) throw new NotFoundException(`知识 #${id} 不存在`);
    return knowledge;
  }

  async update(id: string, updateDto: UpdateKnowledgeDto) {
    await this.findOne(id);
    return this.prisma.knowledge.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.knowledge.delete({ where: { id } });
  }
}