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
import { VolumeService } from './volume.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';

@Controller('volumes')
@UseGuards(JwtAuthGuard)
export class VolumeController {
  constructor(private readonly volumeService: VolumeService) {}

  @Post()
  create(@Body() createDto: CreateVolumeDto) {
    return this.volumeService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.volumeService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volumeService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateVolumeDto) {
    return this.volumeService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volumeService.remove(id);
  }

  @Put(':id/reorder')
  reorder(@Param('id') id: string, @Body('order') order: number) {
    return this.volumeService.reorder(id, order);
  }
}