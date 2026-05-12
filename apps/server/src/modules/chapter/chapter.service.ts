import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChapterService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateChapterDto) {
    const count = await this.prisma.chapter.count({
      where: { volumeId: createDto.volumeId },
    });

    return this.prisma.chapter.create({
      data: {
        id: uuidv4(),
        ...createDto,
        order: createDto.order ?? count + 1,
        wordCount: 0,
        status: 'outline',
      },
    });
  }

  async findByVolume(volumeId: string) {
    return this.prisma.chapter.findMany({
      where: { volumeId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
    });
    if (!chapter) {
      throw new NotFoundException(`章节 #${id} 不存在`);
    }
    return chapter;
  }

  async update(id: string, updateDto: UpdateChapterDto) {
    await this.findOne(id);
    return this.prisma.chapter.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.chapter.delete({
      where: { id },
    });
  }

  async updateContent(id: string, content: string) {
    await this.findOne(id);
    const wordCount = content.length;

    return this.prisma.chapter.update({
      where: { id },
      data: {
        content,
        wordCount,
        status: 'draft',
      },
    });
  }

  async generateContent(id: string) {
    const chapter = await this.findOne(id);
    // TODO: 调用AI生成章节正文
    return { message: 'AI生成功能待实现', chapter };
  }
}