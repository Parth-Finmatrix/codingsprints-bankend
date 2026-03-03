import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller()
export class TopicsController {
  constructor(private readonly service: TopicsService) {}

  @MessagePattern('topic.create')
  create(@Payload() dto: CreateTopicDto) {
    return this.service.create(dto);
  }

  @MessagePattern('topic.findAll')
  findAll(@Payload() query: any) {
    return this.service.findAll(query);
  }

  @MessagePattern('topic.findBySlug')
  findOne(@Payload() slug: string) {
    return this.service.findBySlug(slug);
  }

  @MessagePattern('topic.update')
  update(@Payload() data: { slug: string; dto: UpdateTopicDto }) {
    return this.service.update(data.slug, data.dto);
  }

  @MessagePattern('topic.delete')
  remove(@Payload() slug: string) {
    return this.service.remove(slug);
  }
}
