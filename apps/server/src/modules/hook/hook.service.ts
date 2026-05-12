import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateHookDto } from './dto/create-hook.dto';
import { UpdateHookDto } from './dto/update-hook.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HookService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateHookDto) {
    return this.prisma.hook.create({
      data: { id: uuidv4(), ...createDto },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.hook.findMany({ where: { projectId } });
  }

  async findOne(id: string) {
    const hook = await this.prisma.hook.findUnique({ where: { id } });
    if (!hook) throw new NotFoundException(`Hook #${id} 不存在`);
    return hook;
  }

  async update(id: string, updateDto: UpdateHookDto) {
    await this.findOne(id);
    return this.prisma.hook.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.hook.delete({ where: { id } });
  }
}