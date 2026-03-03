// dto/register.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  ValidateIf,
  IsIn,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  confirmPassword: string;

  @IsBoolean()
  IsAgree: boolean;

  @IsString()
  @IsIn(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN' = 'USER'; // 👈 default
}
