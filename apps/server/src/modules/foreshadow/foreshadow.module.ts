import { Module } from '@nestjs/common';
import { ForeshadowService } from './foreshadow.service';
import { ForeshadowController } from './foreshadow.controller';

@Module({
  controllers: [ForeshadowController],
  providers: [ForeshadowService],
  exports: [ForeshadowService],
})
export class ForeshadowModule {}