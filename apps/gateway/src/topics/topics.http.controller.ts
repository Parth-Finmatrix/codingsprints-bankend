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

@Controller('api/tutorials/topics')
export class TopicsHttpController implements OnModuleInit {
  constructor(
    @Inject('TUTORIALS_CLIENT')
    private readonly topicsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.topicsClient.subscribeToResponseOf('topic.create');
    this.topicsClient.subscribeToResponseOf('topic.findAll');
    this.topicsClient.subscribeToResponseOf('topic.findBySlug');
    this.topicsClient.subscribeToResponseOf('topic.update');
    this.topicsClient.subscribeToResponseOf('topic.delete');
    await this.topicsClient.connect();
  }

  // 🔹 GET: /api/tutorials/topics
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Query() query: any) {
    try {
      return await firstValueFrom(
        this.topicsClient.send('topic.findAll', query),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 GET: /api/tutorials/topics/:slug
  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  async getBySlug(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(
        this.topicsClient.send('topic.findBySlug', slug),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 POST: /api/tutorials/topics
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any) {
    try {
      return await firstValueFrom(this.topicsClient.send('topic.create', body));
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 PUT: /api/tutorials/topics/:slug
  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  async update(@Param('slug') slug: string, @Body() body: any) {
    try {
      return await firstValueFrom(
        this.topicsClient.send('topic.update', { slug, dto: body }),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 DELETE: /api/tutorials/topics/:slug
  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(this.topicsClient.send('topic.delete', slug));
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }
}
