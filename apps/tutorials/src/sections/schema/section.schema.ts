import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SectionDocument = HydratedDocument<Section>;

@Schema({ _id: false })
export class SectionsImage {
  @Prop({ required: false })
  url: string;

  @Prop({ required: false })
  fileKey: string;

  @Prop({ required: false })
  uploadId: string;
}

const SectionsImageSchema = SchemaFactory.createForClass(SectionsImage);

@Schema({ timestamps: true })
export class Section {
  @Prop({
    required: [true, 'Section title is required.'],
    trim: true,
    minlength: [3, 'Section title must be at least 3 characters long.'],
    maxlength: [150, 'Section title cannot exceed 150 characters.'],
  })
  title: string;

  @Prop({
    required: [true, 'Section slug is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Slug must be at least 3 characters long.'],
    maxlength: [160, 'Slug cannot exceed 160 characters.'],
    match: [
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only).',
    ],
  })
  slug: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Technology',
    required: [true, 'Technology reference is required.'],
  })
  technologyId: Types.ObjectId;

  @Prop({ default: 0, min: [0, 'Order must be a positive number.'] })
  order: number;

  @Prop({ type: SectionsImageSchema, required: false })
  imageUrl: SectionsImage;
}

export const SectionSchema = SchemaFactory.createForClass(Section);

/* 🔥 TEXT INDEX FOR SEARCH */
SectionSchema.index(
  { title: 'text', slug: 'text' },
  {
    weights: { title: 3, slug: 2 },
    name: 'SectionTextIndex',
    default_language: 'none',
  },
);
