// auth/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import {
  UserPreferences,
  UserPreferencesSchema,
} from './user-preferences.schema';
import { compareValue, hashValue } from '../../common/utils/bcrypt';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: any) => {
      delete ret.password;
      delete ret.userPreferences?.twoFactorSecret;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: UserPreferencesSchema, default: {} })
  userPreferences: UserPreferences;

  @Prop({ default: true })
  IsAgree: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'Roles',
    required: true,
  })
  role: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Admin',
    required: false,
  })
  admin: Types.ObjectId;

  comparePassword: (value: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

/* 🔽 YEHI JAGAH HAI */
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hashValue(this.password);
  }
});

UserSchema.methods.comparePassword = async function (value: string) {
  return compareValue(value, this.password);
};
