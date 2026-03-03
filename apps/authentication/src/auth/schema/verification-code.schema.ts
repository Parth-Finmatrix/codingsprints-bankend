import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { VerificationEnum } from '../../common/enums/verification-code.enum';
import { generateUniqueCode } from '../../common/utils/uuid';

export type VerificationCodeDocument =
  HydratedDocument<VerificationCode>;

@Schema({
  timestamps: true,
})
export class VerificationCode {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    index: true,
    required: [true, 'User reference is required.'],
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    default: generateUniqueCode,
  })
  code: string;

  @Prop({
    type: String,
    enum: {
      values: Object.values(VerificationEnum),
      message: 'Invalid verification type.',
    },
    required: [true, 'Verification type is required.'],
  })
  type: VerificationEnum;

  @Prop({
    required: [true, 'Expiration date is required.'],
  })
  expiresAt: Date;
}

export const VerificationCodeSchema =
  SchemaFactory.createForClass(VerificationCode);

/* 🔥 Auto delete expired verification codes */
VerificationCodeSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

VerificationCodeSchema.index({ userId: 1 });
