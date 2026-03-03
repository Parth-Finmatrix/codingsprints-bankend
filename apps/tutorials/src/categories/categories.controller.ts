import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CategoriesService } from './categories.service';

@Controller()
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @MessagePattern('categories.getAll')
  getAll(@Payload() query: any) {
    console.log('Kafka categories getAll received: 2', query);
    return this.service.getAll(query);
  }

  @MessagePattern('categories.getBySlug')
  getBySlug(@Payload() data: { slug: string }) {
    return this.service.getBySlug(data.slug);
  }

  @MessagePattern('categories.create')
  create(@Payload() body: any) {
    return this.service.create(body);
  }

  @MessagePattern('categories.update')
  update(@Payload() data: { slug: string; body: any }) {
    return this.service.update(data.slug, data.body);
  }

  @MessagePattern('categories.delete')
  delete(@Payload() data: { slug: string }) {
    return this.service.delete(data.slug);
  }
}
