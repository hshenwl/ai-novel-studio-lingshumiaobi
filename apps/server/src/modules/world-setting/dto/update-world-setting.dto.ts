import { PartialType } from '@nestjs/mapped-types';
import { CreateWorldSettingDto } from './create-world-setting.dto';

export class UpdateWorldSettingDto extends PartialType(CreateWorldSettingDto) {}