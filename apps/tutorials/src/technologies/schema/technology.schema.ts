import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TechnologyDocument = HydratedDocument<Technology>;

@Schema({ _id: false })
export class TechnologyImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fileKey: string;

  @Prop({ required: true })
  uploadId: string;
}

const TechnologyImageSchema = SchemaFactory.createForClass(TechnologyImage);

@Schema({ timestamps: true })
export class Technology {
  @Prop({
    required: [true, 'Technology title is required.'],
    unique: true,
    trim: true,
    minlength: [3, 'Technology title must be at least 3 characters long.'],
    maxlength: [100, 'Technology title cannot exceed 100 characters.'],
  })
  title: string;

  @Prop({
    required: [true, 'Technology description is required.'],
    unique: true,
    trim: true,
    minlength: [
      10,
      'Technology description must be at least 10 characters long.',
    ],
    maxlength: [500, 'Technology description cannot exceed 500 characters.'],
  })
  description: string;

  @Prop({
    required: [true, 'Technology slug is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Slug must be at least 3 characters long.'],
    maxlength: [120, 'Slug cannot exceed 120 characters.'],
    match: [
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only).',
    ],
  })
  slug: string;

  @Prop({
    required: [true, 'Technology type is required.'],
    enum: {
      values: ['tutorial', 'course'],
      message: 'Technology type must be either "tutorial" or "course".',
    },
  })
  type: 'tutorial' | 'course';

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category reference is required.'],
  })
  categoryId: Types.ObjectId;

  @Prop({
    required: [true, 'Technology content is required.'],
    minlength: [20, 'Content must be at least 20 characters long.'],
  })
  content: string;

  @Prop({ type: TechnologyImageSchema, required: true })
  imageUrl: TechnologyImage;
}

export const TechnologySchema = SchemaFactory.createForClass(Technology);

/* ===========================
   🔥 PRODUCTION INDEXES
=========================== */

// TEXT SEARCH INDEX
TechnologySchema.index(
  { title: 'text', slug: 'text' },
  {
    weights: { title: 5, slug: 3 },
    name: 'TechnologyTextSearchIndex',
  },
);

// FILTER + SORT INDEX
TechnologySchema.index({ categoryId: 1, createdAt: -1 });
TechnologySchema.index({ createdAt: -1 });
TechnologySchema.index({ slug: 1 }, { unique: true });
TechnologySchema.index({ title: 1 }, { unique: true });
