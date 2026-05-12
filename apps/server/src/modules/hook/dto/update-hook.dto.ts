import { PartialType } from '@nestjs/mapped-types';
import { CreateHookDto } from './create-hook.dto';

export class UpdateHookDto extends PartialType(CreateHookDto) {}