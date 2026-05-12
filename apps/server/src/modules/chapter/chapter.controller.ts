import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Controller('chapters')
@UseGuards(JwtAuthGuard)
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  create(@Body() createDto: CreateChapterDto) {
    return this.chapterService.create(createDto);
  }

  @Get('volume/:volumeId')
  findByVolume(@Param('volumeId') volumeId: string) {
    return this.chapterService.findByVolume(volumeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chapterService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateChapterDto) {
    return this.chapterService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chapterService.remove(id);
  }

  @Put(':id/content')
  updateContent(
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chapterService.updateContent(id, content);
  }

  @Post(':id/generate')
  generateContent(@Param('id') id: string) {
    return this.chapterService.generateContent(id);
  }
}