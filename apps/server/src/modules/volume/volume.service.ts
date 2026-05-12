import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VolumeService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateVolumeDto) {
    // 获取当前项目下的卷数量，用于设置order
    const count = await this.prisma.volume.count({
      where: { projectId: createDto.projectId },
    });

    return this.prisma.volume.create({
      data: {
        id: uuidv4(),
        ...createDto,
        order: createDto.order ?? count + 1,
        wordCount: 0,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.volume.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const volume = await this.prisma.volume.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!volume) {
      throw new NotFoundException(`卷 #${id} 不存在`);
    }
    return volume;
  }

  async update(id: string, updateDto: UpdateVolumeDto) {
    await this.findOne(id);
    return this.prisma.volume.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.volume.delete({
      where: { id },
    });
  }

  async reorder(id: string, order: number) {
    await this.findOne(id);
    return this.prisma.volume.update({
      where: { id },
      data: { order },
    });
  }
}