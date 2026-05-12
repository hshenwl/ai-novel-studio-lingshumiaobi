import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';

@Controller('relationships')
@UseGuards(JwtAuthGuard)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  create(@Body() createDto: CreateRelationshipDto) {
    return this.relationshipService.create(createDto);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.relationshipService.findByProject(projectId);
  }

  @Get('character/:characterId')
  findByCharacter(@Param('characterId') characterId: string) {
    return this.relationshipService.findByCharacter(characterId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.relationshipService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateRelationshipDto) {
    return this.relationshipService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.relationshipService.remove(id);
  }
}