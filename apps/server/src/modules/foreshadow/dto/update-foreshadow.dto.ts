import { PartialType } from '@nestjs/mapped-types';
import { CreateForeshadowDto } from './create-foreshadow.dto';

export class UpdateForeshadowDto extends PartialType(CreateForeshadowDto) {}