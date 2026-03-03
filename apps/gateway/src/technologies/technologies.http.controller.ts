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
import { CreateTechnologyDto } from 'apps/tutorials/src/technologies/dto/create-technology.dto';
import { throwHttpFromRpc } from '@app/rpc/exceptions/http-exception.mapper';

@Controller('api/tutorials/technologies')
export class TechnologiesHttpController implements OnModuleInit {
  constructor(
    @Inject('TUTORIALS_CLIENT')
    private readonly technologiesClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.technologiesClient.subscribeToResponseOf('technologies.create');
    this.technologiesClient.subscribeToResponseOf('technologies.findAll');
    this.technologiesClient.subscribeToResponseOf('technologies.findBySlug');
    this.technologiesClient.subscribeToResponseOf('technologies.update');
    this.technologiesClient.subscribeToResponseOf('technologies.delete');
    await this.technologiesClient.connect();
  }

  // 🔹 GET: /api/tutorials/technologies
  @Get()
  // @UseGuards(JwtAuthGuard)
  async getAll(@Query() query: any) {
    try {
      return await firstValueFrom(
        this.technologiesClient.send('technologies.findAll', query),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 GET: /api/tutorials/technologies/:slug
  @Get(':slug')
  // @UseGuards(JwtAuthGuard)
  async getBySlug(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(
        this.technologiesClient.send('technologies.findBySlug', slug),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 POST: /api/tutorials/technologies
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateTechnologyDto) {
    console.log('body tech =>', body);
    try {
      return await firstValueFrom(
        this.technologiesClient.send('technologies.create', body),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 PUT: /api/tutorials/technologies/:slug
  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  async update(@Param('slug') slug: string, @Body() body: any) {
    try {
      return await firstValueFrom(
        this.technologiesClient.send('technologies.update', {
          slug,
          dto: body,
        }),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }

  // 🔹 DELETE: /api/tutorials/technologies/:slug
  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(
        this.technologiesClient.send('technologies.delete', slug),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }
}
