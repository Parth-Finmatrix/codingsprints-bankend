import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Length, ValidateNested } from 'class-validator';
import { CategoryImageDto } from './category-image.dto';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 50, { message: 'Title must be 3-50 characters long' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug is required' })
  @Length(3, 50, { message: 'Slug must be 3-50 characters long' })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @Length(3, 100, { message: 'Description must be 3-100 characters long' })
  description: string;

  // 🔥 object instead of string
  @ValidateNested()
  @Type(() => CategoryImageDto)
  imageUrl: CategoryImageDto;
}
