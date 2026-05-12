import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateWorldSettingDto } from './dto/create-world-setting.dto';
import { UpdateWorldSettingDto } from './dto/update-world-setting.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorldSettingService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateWorldSettingDto) {
    return this.prisma.worldSetting.create({
      data: {
        id: uuidv4(),
        ...createDto,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.worldSetting.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const setting = await this.prisma.worldSetting.findUnique({
      where: { id },
    });
    if (!setting) {
      throw new NotFoundException(`世界设定 #${id} 不存在`);
    }
    return setting;
  }

  async update(id: string, updateDto: UpdateWorldSettingDto) {
    await this.findOne(id);
    return this.prisma.worldSetting.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.worldSetting.delete({
      where: { id },
    });
  }
}