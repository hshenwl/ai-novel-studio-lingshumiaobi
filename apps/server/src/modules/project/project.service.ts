import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        id: uuidv4(),
        ...createProjectDto,
        userId,
        status: 'draft',
        wordCount: 0,
        targetWordCount: createProjectDto.targetWordCount || 100000,
      },
    });
  }

  async findAll(query: QueryProjectDto, userId: string) {
    const { page = 1, pageSize = 10, status, keyword, genre } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    if (genre) {
      where.genre = genre;
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { volumes: true, characters: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        volumes: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
        characters: true,
        worldSettings: true,
        organizations: true,
        professions: true,
        _count: {
          select: {
            volumes: true,
            characters: true,
            worldSettings: true,
            foreshadows: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`项目 #${id} 不存在`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async export(id: string, format: string = 'json') {
    const project = await this.findOne(id);
    
    // 构建导出数据
    const exportData = {
      title: project.title,
      description: project.description,
      genre: project.genre,
      wordCount: project.wordCount,
      volumes: project.volumes.map(v => ({
        title: v.title,
        outline: v.outline,
        chapters: v.chapters.map(c => ({
          title: c.title,
          outline: c.outline,
          content: c.content,
          wordCount: c.wordCount,
          status: c.status,
        })),
      })),
      characters: project.characters,
      worldSettings: project.worldSettings,
      exportedAt: new Date().toISOString(),
    };

    return {
      format,
      data: exportData,
      filename: `${project.title}_${Date.now()}.${format}`,
    };
  }

  async duplicate(id: string, userId: string) {
    const project = await this.findOne(id);
    const { id: _, createdAt, updatedAt, volumes, characters, worldSettings, ...projectData } = project;

    // 创建项目副本
    const newProject = await this.prisma.project.create({
      data: {
        id: uuidv4(),
        ...projectData,
        title: `${project.title} - 副本`,
        userId,
      },
    });

    // 复制卷和章节
    for (const volume of volumes) {
      const { id: vId, projectId, createdAt: vCreatedAt, updatedAt: vUpdatedAt, chapters, ...volumeData } = volume;
      const newVolume = await this.prisma.volume.create({
        data: {
          id: uuidv4(),
          ...volumeData,
          projectId: newProject.id,
        },
      });

      for (const chapter of chapters) {
        const { id: cId, volumeId, createdAt: cCreatedAt, updatedAt: cUpdatedAt, ...chapterData } = chapter;
        await this.prisma.chapter.create({
          data: {
            id: uuidv4(),
            ...chapterData,
            volumeId: newVolume.id,
          },
        });
      }
    }

    // 复制角色
    for (const character of characters) {
      const { id: cId, projectId, createdAt: cCreatedAt, updatedAt: cUpdatedAt, ...characterData } = character;
      await this.prisma.character.create({
        data: {
          id: uuidv4(),
          ...characterData,
          projectId: newProject.id,
        },
      });
    }

    // 复制世界设定
    for (const setting of worldSettings) {
      const { id: sId, projectId, createdAt: sCreatedAt, updatedAt: sUpdatedAt, ...settingData } = setting;
      await this.prisma.worldSetting.create({
        data: {
          id: uuidv4(),
          ...settingData,
          projectId: newProject.id,
        },
      });
    }

    return this.findOne(newProject.id);
  }

  async getStatistics(userId: string) {
    const [
      totalProjects,
      draftProjects,
      ongoingProjects,
      completedProjects,
      totalWords,
      totalVolumes,
      totalChapters,
    ] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.project.count({ where: { userId, status: 'draft' } }),
      this.prisma.project.count({ where: { userId, status: 'ongoing' } }),
      this.prisma.project.count({ where: { userId, status: 'completed' } }),
      this.prisma.project.aggregate({
        where: { userId },
        _sum: { wordCount: true },
      }),
      this.prisma.volume.count({
        where: { project: { userId } },
      }),
      this.prisma.chapter.count({
        where: { volume: { project: { userId } } },
      }),
    ]);

    return {
      totalProjects,
      draftProjects,
      ongoingProjects,
      completedProjects,
      totalWords: totalWords._sum.wordCount || 0,
      totalVolumes,
      totalChapters,
    };
  }

  async getOverview(id: string) {
    const project = await this.findOne(id);

    // 获取活跃伏笔数量
    const activeForeshadows = await this.prisma.foreshadow.count({
      where: { projectId: id, status: 'active' },
    });

    // 获取最近更新的章节
    const recentChapters = await this.prisma.chapter.findMany({
      where: { volume: { projectId: id } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        wordCount: project.wordCount,
        targetWordCount: project.targetWordCount,
        progress: Math.round((project.wordCount / project.targetWordCount) * 100),
      },
      statistics: {
        volumes: project._count.volumes,
        characters: project._count.characters,
        worldSettings: project._count.worldSettings,
        activeForeshadows,
      },
      recentChapters,
    };
  }
}
