import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCharacterDto) {
    return this.prisma.character.create({
      data: {
        id: uuidv4(),
        ...createDto,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.character.findMany({
      where: { projectId },
      include: {
        organization: true,
        profession: true,
      },
    });
  }

  async findOne(id: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        organization: true,
        profession: true,
        relationshipsAsSource: true,
        relationshipsAsTarget: true,
      },
    });
    if (!character) {
      throw new NotFoundException(`角色 #${id} 不存在`);
    }
    return character;
  }

  async update(id: string, updateDto: UpdateCharacterDto) {
    await this.findOne(id);
    return this.prisma.character.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.character.delete({
      where: { id },
    });
  }
}