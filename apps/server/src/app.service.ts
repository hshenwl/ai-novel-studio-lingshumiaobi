import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'AI Novel Studio API - 本地优先、云端兼容的AI小说创作工具';
  }
}