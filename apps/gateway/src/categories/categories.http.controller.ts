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
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { throwHttpFromRpc } from '@app/rpc/exceptions/http-exception.mapper';

@Controller('api/tutorials/categories')
export class CategoriesHttpController {
  constructor(
    @Inject('TUTORIALS_CLIENT')
    private readonly categoriesClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.categoriesClient.subscribeToResponseOf('categories.getAll');
    this.categoriesClient.subscribeToResponseOf('categories.getBySlug');
    this.categoriesClient.subscribeToResponseOf('categories.create');
    this.categoriesClient.subscribeToResponseOf('categories.update');
    this.categoriesClient.subscribeToResponseOf('categories.delete');
    await this.categoriesClient.connect();
  }

  // 🔹 GET: /api/tutorials/categories
  @Get('/')
  // @UseGuards(JwtAuthGuard)
  async getAll(@Query() query: any) {
    try {
      return await firstValueFrom(
        this.categoriesClient.send('categories.getAll', query),
      );
    } catch (err: any) {
      const error = err?.error || err;

      console.log('error handling =>', error, 'err =>', err);

      throw new HttpException(
        {
          success: false,
          message: error?.message || 'Something went wrong',
          code: error?.code,
        },
        error?.httpStatus || 500,
      );
    }
  }

  @Get(':slug')
  // @UseGuards(JwtAuthGuard)
  async getBySlug(@Param('slug') slug: string) {
    try {
      return await firstValueFrom(
        this.categoriesClient.send('categories.getBySlug', { slug }),
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
        this.categoriesClient.send('categories.create', body),
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
        this.categoriesClient.send('categories.update', { slug, body }),
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
        this.categoriesClient.send('categories.delete', { slug }),
      );
    } catch (err: any) {
      throwHttpFromRpc(err);
    }
  }
}
