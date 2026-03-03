import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { compareValue, hashValue } from '../../common/utils/bcrypt';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({
  timestamps: true,
  collection: 'admins',
  toJSON: {
    transform: (_doc, ret: any) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class Admin {
  @Prop({
    required: [true, 'Admin name is required.'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long.'],
    maxlength: [100, 'Name cannot exceed 100 characters.'],
  })
  name: string;

  @Prop({
    required: [true, 'Admin email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address.',
    ],
  })
  email: string;

  @Prop({
    required: [true, 'Password is required.'],
    minlength: [8, 'Password must be at least 8 characters long.'],
    maxlength: [128, 'Password cannot exceed 128 characters.'],
    select: false, // prevent returning password in queries
  })
  password: string;

  /** 🔥 Role reference */
  @Prop({
    type: Types.ObjectId,
    ref: 'Roles',
    required: [true, 'Role reference is required.'],
  })
  role: Types.ObjectId;

  @Prop({
    enum: {
      values: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED.',
    },
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  @Prop({ default: false })
  isDeleted: boolean;

  comparePassword: (value: string) => Promise<boolean>;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
