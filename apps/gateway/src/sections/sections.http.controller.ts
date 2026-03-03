import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  OnModuleInit,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { throwHttpFromRpc } from '@app/rpc/exceptions/http-exception.mapper';

@Controller('api/tutorials/sections')
export class SectionsHttpController implements OnModuleInit {
  constructor(
    @Inject('TUTORIALS_CLIENT')
    private readonly sectionsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.sectionsClient.subscribeToResponseOf('section.create');
    this.sectionsClient.subscribeToResponseOf('section.findAll');
    this.sectionsClient.subscribeToResponseOf('section.findBySlug');
    this.sectionsClient.subscribeToResponseOf('section.update');
    this.sectionsClient.subscribeToResponseOf('section.delete');
    await this.sectionsClient.connect();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Query() query: any) {
    try {
      return await firstValueFrom(
        this.sectionsClient.send('section.findAll', query),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  async getBySlug(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(
        this.sectionsClient.send('section.findBySlug', slug),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any) {
    try {
      return await firstValueFrom(
        this.sectionsClient.send('section.create', body),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  async update(@Param('slug') slug: string, @Body() body: any) {
    try {
      return await firstValueFrom(
        this.sectionsClient.send('section.update', { slug, dto: body }),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(
        this.sectionsClient.send('section.delete', slug),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }
}
