import { Module } from '@nestjs/common';
import { HookService } from './hook.service';
import { HookController } from './hook.controller';

@Module({
  controllers: [HookController],
  providers: [HookService],
  exports: [HookService],
})
export class HookModule {}