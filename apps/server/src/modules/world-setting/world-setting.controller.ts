import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorldSettingService } from './world-setting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorldSettingDto } from './dto/create-world-setting.dto';
import { UpdateWorldSettingDto } from './dto/update-world-setting.dto';

@Controller('world-settings')
@UseGuards(JwtAuthGuard)
export class WorldSettingController {
  constructor(private readonly worldSettingService: WorldSettingService) {}

  @Post()
  create(@Body() createDto: CreateWorldSettingDto) {
    return this.worldSettingService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.worldSettingService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worldSettingService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateWorldSettingDto) {
    return this.worldSettingService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.worldSettingService.remove(id);
  }
}