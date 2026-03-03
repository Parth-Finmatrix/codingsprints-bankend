import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ _id: false })
export class CategoryImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fileKey: string;

  @Prop({ required: true })
  uploadId: string;
}

const CategoryImageSchema = SchemaFactory.createForClass(CategoryImage);

@Schema({ timestamps: true })
export class Category {
  @Prop({
    required: [true, 'Category title is required.'],
    unique: true,
    trim: true,
    minlength: [3, 'Category title must be at least 3 characters long.'],
    maxlength: [100, 'Category title cannot exceed 100 characters.'],
  })
  title: string;

  @Prop({
    required: [true, 'Category slug is required.'],
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
    required: [true, 'Category description is required.'],
    trim: true,
    minlength: [
      10,
      'Category description must be at least 10 characters long.',
    ],
    maxlength: [500, 'Category description cannot exceed 500 characters.'],
  })
  description: string;

  @Prop({ type: CategoryImageSchema, required: true })
  imageUrl: CategoryImage;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

/* 🔥 TEXT INDEX FOR SEARCH WITH WEIGHTS */
CategorySchema.index(
  { title: 'text', slug: 'text' },
  {
    weights: { title: 3, slug: 2 },
    name: 'CategoryTextIndex',
    default_language: 'none',
  },
);
