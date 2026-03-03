// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';

// export type TopicDocument = Topic & Document;

// @Schema({ timestamps: true })
// export class Topic {
//   @Prop({ required: true })
//   tags: string;

//   @Prop({ required: true })
//   title: string;

//   @Prop({ required: true, unique: true })
//   slug: string;

//   @Prop()
//   order?: number;

//   @Prop()
//   content: string;

//   @Prop({ type: Types.ObjectId, ref: 'Section', required: true })
//   sectionId: Types.ObjectId;

//   @Prop({ enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' })
//   status: string;
// }

// export const TopicSchema = SchemaFactory.createForClass(Topic);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ _id: false })
export class TopicsImage {
  @Prop({ required: false })
  url: string;

  @Prop({ required: false })
  fileKey: string;

  @Prop({ required: false })
  uploadId: string;
}

const TopicsImageSchema = SchemaFactory.createForClass(TopicsImage);

@Schema({ timestamps: true })
export class Topic {
  @Prop({
    type: [String],
    required: [true, 'At least one tag is required.'],
    validate: {
      validator: (value: string[]) => value.length > 0,
      message: 'At least one tag must be provided.',
    },
  })
  tags: string[];

  // @Prop({
  //   type: String,
  //   required: [true, 'At least one tag is required.'],
  //   maxlength: [10, 'Topic title cannot exceed 10 characters.'],
  // })
  // tags: string;

  @Prop({
    required: [true, 'Topic title is required.'],
    trim: true,
    minlength: [3, 'Topic title must be at least 3 characters long.'],
    maxlength: [200, 'Topic title cannot exceed 200 characters.'],
  })
  title: string;

  @Prop({
    required: [true, 'Topic slug is required.'],
    trim: true,
    lowercase: true,
    minlength: [3, 'Slug must be at least 3 characters long.'],
    maxlength: [220, 'Slug cannot exceed 220 characters.'],
    match: [
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only).',
    ],
  })
  slug: string;

  @Prop({ default: 0, min: [0, 'Order must be a positive number.'] })
  order?: number;

  @Prop({
    required: [true, 'Topic content is required.'],
    minlength: [20, 'Content must be at least 20 characters long.'],
  })
  content: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Section',
    required: [true, 'Section reference is required.'],
  })
  sectionId: Types.ObjectId;

  @Prop({
    enum: {
      values: ['DRAFT', 'PUBLISHED'],
      message: 'Status must be either "DRAFT" or "PUBLISHED".',
    },
    default: 'DRAFT',
  })
  status: 'DRAFT' | 'PUBLISHED';

  @Prop({ type: TopicsImageSchema, required: false })
  imageUrl: TopicsImage;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

/* 🔥 TEXT INDEX FOR SEARCH */
TopicSchema.index(
  { title: 'text', slug: 'text', tags: 'text' },
  {
    weights: { title: 3, slug: 2, tags: 1 },
    name: 'TopicTextIndex',
    default_language: 'none',
  },
);
