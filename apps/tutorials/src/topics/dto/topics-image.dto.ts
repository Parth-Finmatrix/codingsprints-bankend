import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class TopicsImageDto {
  @IsString()
  @IsUrl()
  url: string;

  @IsString()
  // @IsNotEmpty()
  fileKey: string;

  @IsString()
  // @IsNotEmpty()
  uploadId: string;
}
