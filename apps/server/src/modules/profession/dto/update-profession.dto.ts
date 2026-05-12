import { PartialType } from '@nestjs/mapped-types';
import { CreateProfessionDto } from './create-profession.dto';

export class UpdateProfessionDto extends PartialType(CreateProfessionDto) {}