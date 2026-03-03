import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionQueryDto } from './dto/section-query.dto';

@Controller()
export class SectionsController {
  constructor(private readonly service: SectionsService) {}

  @MessagePattern('section.create')
  create(@Payload() dto: CreateSectionDto) {
    return this.service.create(dto);
  }

  @MessagePattern('section.findAll')
  findAll(@Payload() query: SectionQueryDto) {
    return this.service.findAll(query);
  }

  @MessagePattern('section.findBySlug')
  findOne(@Payload() slug: string) {
    return this.service.findBySlug(slug);
  }

  @MessagePattern('section.update')
  update(@Payload() data: { slug: string; dto: UpdateSectionDto }) {
    return this.service.update(data.slug, data.dto);
  }

  @MessagePattern('section.delete')
  remove(@Payload() slug: string) {
    return this.service.remove(slug);
  }
}
