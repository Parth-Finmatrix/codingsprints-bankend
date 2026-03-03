import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { thirtyDaysFromNow } from '../../common/utils/date-time';

export type SessionDocument = HydratedDocument<Session>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
})
export class Session {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    index: true,
    required: [true, 'User reference is required.'],
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Role',
    index: true,
    required: [true, 'Role reference is required.'],
  })
  roleId: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: [300, 'User agent cannot exceed 300 characters.'],
  })
  userAgent?: string;

  @Prop({
    required: true,
    default: thirtyDaysFromNow,
  })
  expiredAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

/* 🔥 Auto delete expired sessions */
SessionSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });
