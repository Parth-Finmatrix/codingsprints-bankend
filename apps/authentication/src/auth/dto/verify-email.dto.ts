// dto/verify-email.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @MinLength(1)
  @MaxLength(25)
  code: string;
}
