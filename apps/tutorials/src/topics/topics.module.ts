import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './schema/topic.schema';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
    SectionsModule,
  ],
  exports: [MongooseModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
