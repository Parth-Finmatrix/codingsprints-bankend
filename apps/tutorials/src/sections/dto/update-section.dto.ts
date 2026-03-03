import { PartialType } from '@nestjs/mapped-types';
import { CreateSectionDto } from './create-section.dto';
import { IsMongoId, IsOptional } from 'class-validator';

export class UpdateSectionDto extends PartialType(CreateSectionDto) {
  @IsOptional()
  @IsMongoId()
  technology?: string;
}
