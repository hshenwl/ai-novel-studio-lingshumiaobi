import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { QueryKnowledgeDto } from './dto/query-knowledge.dto';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  create(@Body() createDto: CreateKnowledgeDto) {
    return this.knowledgeService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @Query() query: QueryKnowledgeDto) {
    return this.knowledgeService.findByProject(projectId, query);
  }

  @Get('search')
  search(@Query('keyword') keyword: string, @Query('projectId') projectId: string) {
    return this.knowledgeService.search(projectId, keyword);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateKnowledgeDto) {
    return this.knowledgeService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }
}