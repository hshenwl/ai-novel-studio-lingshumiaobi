import { Module } from '@nestjs/common';
import { WorldSettingService } from './world-setting.service';
import { WorldSettingController } from './world-setting.controller';

@Module({
  controllers: [WorldSettingController],
  providers: [WorldSettingService],
  exports: [WorldSettingService],
})
export class WorldSettingModule {}