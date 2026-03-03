import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TechnologiesService } from './technologies.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { UpdateTechnologyDto } from './dto/update-technology.dto';

@Controller()
export class TechnologiesController {
  constructor(private readonly service: TechnologiesService) {}

  @MessagePattern('technologies.create')
  create(@Payload() dto: CreateTechnologyDto) {
    console.log('technology Dto', dto);
    return this.service.create(dto);
  }

  @MessagePattern('technologies.findAll')
  findAll(@Payload() query: any) {
    console.log('Kafka findAll received: 2', query);
    return this.service.findAll(query);
  }

  @MessagePattern('technologies.findBySlug')
  findOne(@Payload() slug: string) {
    return this.service.findBySlug(slug);
  }

  @MessagePattern('technologies.update')
  update(@Payload() data: { slug: string; dto: UpdateTechnologyDto }) {
    return this.service.update(data.slug, data.dto);
  }

  @MessagePattern('technologies.delete')
  remove(@Payload() slug: string) {
    return this.service.remove(slug);
  }
}
