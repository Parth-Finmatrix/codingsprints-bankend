import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumberString,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export class SectionQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  technologySlug?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;
}
