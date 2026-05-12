import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        id: uuidv4(),
        ...createDto,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.organization.findMany({
      where: { projectId },
      include: {
        members: true,
      },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });
    if (!organization) {
      throw new NotFoundException(`组织 #${id} 不存在`);
    }
    return organization;
  }

  async update(id: string, updateDto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.organization.delete({
      where: { id },
    });
  }
}