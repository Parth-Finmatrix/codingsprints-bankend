import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { TopicsImageDto } from './topics-image.dto';

export class CreateTopicDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  order?: number;

  @IsString()
  content: string;

  @IsString()
  @IsMongoId()
  section: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';

  @ValidateNested()
  @Type(() => TopicsImageDto)
  imageUrl: TopicsImageDto;
}
