import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateForeshadowDto } from './dto/create-foreshadow.dto';
import { UpdateForeshadowDto } from './dto/update-foreshadow.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ForeshadowService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateForeshadowDto) {
    return this.prisma.foreshadow.create({
      data: { id: uuidv4(), ...createDto, status: 'active' },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.foreshadow.findMany({
      where: { projectId },
      include: { chapter: true },
    });
  }

  async findOne(id: string) {
    const foreshadow = await this.prisma.foreshadow.findUnique({ where: { id } });
    if (!foreshadow) throw new NotFoundException(`伏笔 #${id} 不存在`);
    return foreshadow;
  }

  async update(id: string, updateDto: UpdateForeshadowDto) {
    await this.findOne(id);
    return this.prisma.foreshadow.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.foreshadow.delete({ where: { id } });
  }

  async resolve(id: string, resolvedChapterId: string) {
    await this.findOne(id);
    return this.prisma.foreshadow.update({
      where: { id },
      data: { status: 'resolved', resolvedChapterId },
    });
  }
}