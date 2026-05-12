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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: '创建项目', description: '创建一个新的小说项目' })
  @ApiResponse({ status: 201, description: '项目创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表', description: '分页获取用户的项目列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryProjectDto, @Request() req: any) {
    return this.projectService.findAll(query, req.user.userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取项目统计', description: '获取用户的整体项目统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStatistics(@Request() req: any) {
    return this.projectService.getStatistics(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情', description: '根据ID获取项目详细信息' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目', description: '更新项目信息' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目', description: '删除指定项目及其所有相关数据' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @Post(':id/export')
  @ApiOperation({ summary: '导出项目', description: '导出项目为指定格式文件' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '导出成功' })
  export(@Param('id') id: string, @Body('format') format: string) {
    return this.projectService.export(id, format);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '复制项目', description: '创建项目副本' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 201, description: '复制成功' })
  duplicate(@Param('id') id: string, @Request() req: any) {
    return this.projectService.duplicate(id, req.user.userId);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: '获取项目概览', description: '获取项目的完整概览信息' })
  @ApiParam({ name: 'id', description: '项目ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getOverview(@Param('id') id: string) {
    return this.projectService.getOverview(id);
  }
}
