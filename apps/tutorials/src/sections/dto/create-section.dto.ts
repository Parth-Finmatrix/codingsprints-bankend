import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { SectionsImageDto } from './section-image.dto';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  technology: string; // technologyId

  @ValidateNested()
  @Type(() => SectionsImageDto)
  imageUrl: SectionsImageDto;
}
