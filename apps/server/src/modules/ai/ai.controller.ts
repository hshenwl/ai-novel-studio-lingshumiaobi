import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateTextDto } from './dto/generate-text.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  generateText(@Body() generateDto: GenerateTextDto) {
    return this.aiService.generateText(generateDto);
  }

  @Post('chat')
  chat(@Body('messages') messages: any[]) {
    return this.aiService.chat(messages);
  }

  @Post('analyze')
  analyzeText(@Body('text') text: string) {
    return this.aiService.analyzeText(text);
  }
}