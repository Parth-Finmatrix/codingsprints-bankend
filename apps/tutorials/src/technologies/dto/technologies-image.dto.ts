import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class TechnologyImageDto {
  @IsString()
  @IsUrl()
  url: string;

  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @IsString()
  @IsNotEmpty()
  uploadId: string;
}
