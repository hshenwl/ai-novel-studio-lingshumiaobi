import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const configService = app.get(ConfigService);

  // 全局前缀
  app.setGlobalPrefix('api');

  // CORS配置
  app.enableCors({
    origin: configService.get('app.corsOrigin') || 'http://localhost:3000',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle('AI小说创作系统 API')
    .setDescription('AI小说创作系统后端REST API接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '用户认证相关接口')
    .addTag('projects', '项目管理相关接口')
    .addTag('volumes', '卷纲管理相关接口')
    .addTag('chapters', '章节管理相关接口')
    .addTag('world-settings', '世界设定相关接口')
    .addTag('characters', '角色管理相关接口')
    .addTag('organizations', '组织管理相关接口')
    .addTag('professions', '职业等级相关接口')
    .addTag('relationships', '角色关系相关接口')
    .addTag('foreshadows', '伏笔管理相关接口')
    .addTag('hooks', 'Hook管理相关接口')
    .addTag('knowledge', '知识库相关接口')
    .addTag('ai', 'AI模型相关接口')
    .addTag('tasks', '任务队列相关接口')
    .addTag('workflows', '工作流相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('app.port') || 3001;
  await app.listen(port);

  logger.log(`🚀 应用启动成功: http://localhost:${port}/api`);
  logger.log(`📚 API文档地址: http://localhost:${port}/api/docs`);
}

bootstrap();
