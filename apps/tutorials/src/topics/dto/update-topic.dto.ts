import { PartialType } from '@nestjs/mapped-types';
import { CreateTopicDto } from './create-topic.dto';
import { IsMongoId, IsOptional } from 'class-validator';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @IsOptional()
  @IsMongoId()
  section?: string;
}
