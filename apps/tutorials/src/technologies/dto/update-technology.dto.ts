import { PartialType } from '@nestjs/mapped-types';
import { CreateTechnologyDto } from './create-technology.dto';
import { IsMongoId, IsOptional } from 'class-validator';

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {
  @IsOptional()
  @IsMongoId()
  category?: string;
}
