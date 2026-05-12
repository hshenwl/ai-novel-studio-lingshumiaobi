import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfessionService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateProfessionDto) {
    return this.prisma.profession.create({
      data: { id: uuidv4(), ...createDto },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.profession.findMany({
      where: { projectId },
      include: { characters: true },
    });
  }

  async findOne(id: string) {
    const profession = await this.prisma.profession.findUnique({
      where: { id },
      include: { characters: true },
    });
    if (!profession) throw new NotFoundException(`职业 #${id} 不存在`);
    return profession;
  }

  async update(id: string, updateDto: UpdateProfessionDto) {
    await this.findOne(id);
    return this.prisma.profession.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.profession.delete({ where: { id } });
  }
}