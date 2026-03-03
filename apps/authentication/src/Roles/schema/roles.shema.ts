import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RolesDocument = HydratedDocument<Roles>;

export enum RoleName {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Schema({ timestamps: true })
export class Roles {
  @Prop({
    type: String,
    enum: RoleName,
    required: true,
    unique: true,
  })
  name: RoleName;

  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  code: number; // ADMIN = 1, USER = 2

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Roles);
