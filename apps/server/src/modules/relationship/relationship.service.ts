import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RelationshipService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateRelationshipDto) {
    return this.prisma.relationship.create({
      data: { id: uuidv4(), ...createDto },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.relationship.findMany({
      where: { projectId },
      include: { sourceCharacter: true, targetCharacter: true },
    });
  }

  async findByCharacter(characterId: string) {
    return this.prisma.relationship.findMany({
      where: {
        OR: [
          { sourceCharacterId: characterId },
          { targetCharacterId: characterId },
        ],
      },
      include: { sourceCharacter: true, targetCharacter: true },
    });
  }

  async findOne(id: string) {
    const relationship = await this.prisma.relationship.findUnique({
      where: { id },
      include: { sourceCharacter: true, targetCharacter: true },
    });
    if (!relationship) throw new NotFoundException(`关系 #${id} 不存在`);
    return relationship;
  }

  async update(id: string, updateDto: UpdateRelationshipDto) {
    await this.findOne(id);
    return this.prisma.relationship.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.relationship.delete({ where: { id } });
  }
}