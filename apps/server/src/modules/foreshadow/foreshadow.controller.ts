import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ForeshadowService } from './foreshadow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateForeshadowDto } from './dto/create-foreshadow.dto';
import { UpdateForeshadowDto } from './dto/update-foreshadow.dto';

@Controller('foreshadows')
@UseGuards(JwtAuthGuard)
export class ForeshadowController {
  constructor(private readonly foreshadowService: ForeshadowService) {}

  @Post()
  create(@Body() createDto: CreateForeshadowDto) {
    return this.foreshadowService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.foreshadowService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foreshadowService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateForeshadowDto) {
    return this.foreshadowService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foreshadowService.remove(id);
  }

  @Put(':id/resolve')
  resolve(@Param('id') id: string, @Body('resolvedChapterId') resolvedChapterId: string) {
    return this.foreshadowService.resolve(id, resolvedChapterId);
  }
}