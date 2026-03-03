import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ default: false })
  enable2FA: boolean;

  @Prop({ default: true })
  emailNotification: boolean;

  @Prop({
    select: false, // 🔐 never expose secret
  })
  twoFactorSecret?: string;
}

export const UserPreferencesSchema =
  SchemaFactory.createForClass(UserPreferences);
