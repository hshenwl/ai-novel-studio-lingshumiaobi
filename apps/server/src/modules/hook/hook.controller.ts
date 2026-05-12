import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HookService } from './hook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHookDto } from './dto/create-hook.dto';
import { UpdateHookDto } from './dto/update-hook.dto';

@Controller('hooks')
@UseGuards(JwtAuthGuard)
export class HookController {
  constructor(private readonly hookService: HookService) {}

  @Post()
  create(@Body() createDto: CreateHookDto) {
    return this.hookService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.hookService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hookService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateHookDto) {
    return this.hookService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hookService.remove(id);
  }
}