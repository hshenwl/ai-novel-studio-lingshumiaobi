import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProfessionService } from './profession.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';

@Controller('professions')
@UseGuards(JwtAuthGuard)
export class ProfessionController {
  constructor(private readonly professionService: ProfessionService) {}

  @Post()
  create(@Body() createDto: CreateProfessionDto) {
    return this.professionService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.professionService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.professionService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateProfessionDto) {
    return this.professionService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.professionService.remove(id);
  }
}