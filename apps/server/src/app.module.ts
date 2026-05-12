import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { VolumeModule } from './modules/volume/volume.module';
import { ChapterModule } from './modules/chapter/chapter.module';
import { WorldSettingModule } from './modules/world-setting/world-setting.module';
import { CharacterModule } from './modules/character/character.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ProfessionModule } from './modules/profession/profession.module';
import { RelationshipModule } from './modules/relationship/relationship.module';
import { ForeshadowModule } from './modules/foreshadow/foreshadow.module';
import { HookModule } from './modules/hook/hook.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AIModule } from './modules/ai/ai.module';
import { TaskModule } from './modules/task/task.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import aiConfig from './config/ai.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, aiConfig],
      envFilePath: ['.env'],
    }),

    // Prisma数据库模块
    PrismaModule,

    // 业务模块
    AuthModule,
    ProjectModule,
    VolumeModule,
    ChapterModule,
    WorldSettingModule,
    CharacterModule,
    OrganizationModule,
    ProfessionModule,
    RelationshipModule,
    ForeshadowModule,
    HookModule,
    KnowledgeModule,
    AIModule,
    TaskModule,
    WorkflowModule,
  ],
  providers: [
    // 全局JWT认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
