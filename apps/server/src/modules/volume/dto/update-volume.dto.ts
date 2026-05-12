import { PartialType } from '@nestjs/mapped-types';
import { CreateVolumeDto } from './create-volume.dto';

export class UpdateVolumeDto extends PartialType(CreateVolumeDto) {}