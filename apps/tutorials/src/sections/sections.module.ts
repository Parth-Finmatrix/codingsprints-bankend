import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Section, SectionSchema } from './schema/section.schema';
import { TechnologiesModule } from '../technologies/technologies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Section.name, schema: SectionSchema }]),
    TechnologiesModule,
  ],
  exports: [MongooseModule],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
