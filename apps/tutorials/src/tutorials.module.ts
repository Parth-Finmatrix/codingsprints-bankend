import { Module } from '@nestjs/common';
import { TutorialsController } from './tutorials.controller';
import { TutorialsService } from './tutorials.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicsModule } from './topics/topics.module';
import { Category, CategorySchema } from './categories/schemas/category.schema';
import {
  Technology,
  TechnologySchema,
} from './technologies/schema/technology.schema';
import { Section, SectionSchema } from './sections/schema/section.schema';
import { Topic, TopicSchema } from './topics/schema/topic.schema';
import { TechnologiesModule } from './technologies/technologies.module';
import { SectionsModule } from './sections/sections.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_TUTORIAL as string),
    MongooseModule.forFeature([
      // { name: Category.name, schema: CategorySchema },
      // { name: Technology.name, schema: TechnologySchema },
      // { name: Section.name, schema: SectionSchema },
      // { name: Topic.name, schema: TopicSchema },
    ]),

    CategoriesModule,
    TechnologiesModule,
    SectionsModule,
    TopicsModule,
  ],
  controllers: [TutorialsController],
  providers: [TutorialsService],
})
export class TutorialsModule {}
