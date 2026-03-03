import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsMongoId,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TechnologyImageDto } from './technologies-image.dto';

export enum TechnologyType {
  TUTORIAL = 'tutorial',
  COURSE = 'course',
}

export class CreateTechnologyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  description: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsEnum(TechnologyType, {
    message: 'type must be either tutorial or course',
  })
  type: TechnologyType;

  @IsMongoId({ message: 'category must be a valid MongoDB ObjectId' })
  category: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @ValidateNested()
  @Type(() => TechnologyImageDto)
  imageUrl: TechnologyImageDto;
}
