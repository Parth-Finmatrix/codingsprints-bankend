import { PartialType } from '@nestjs/mapped-types';
import { CreateMultiFactorAuthDto } from './create-multi-factor-auth.dto';

export class UpdateMultiFactorAuthDto extends PartialType(CreateMultiFactorAuthDto) {}
