import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Inject,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ClientKafka } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('api/auth/session')
@UseGuards(JwtAuthGuard)
export class SessionHttpController {
  constructor(
    @Inject('AUTHENTICATION_CLIENT')
    private readonly authentication: ClientKafka,
  ) {}

  async onModuleInit() {
    this.authentication.subscribeToResponseOf('session.getAll');
    this.authentication.subscribeToResponseOf('session.getOne');
    this.authentication.subscribeToResponseOf('session.delete');
    await this.authentication.connect();
  }

  // GET /session
  @Get('all')
  async getAllSessions(@Req() req: Request) {
    try {
      console.log(req);
      return await firstValueFrom(
        this.authentication.send('session.getAll', {
          userId: (req.user as any)._id,
          sessionId: (req.user as any).sessionId,
          adminId: (req.user as any).admin,
          role: (req.user as any).role,
        }),
      );
    } catch (err: any) {
      const error = err?.error || err;

      console.log('error handling =>', error);

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

  // GET /session/current
  @Get('current')
  async getCurrentSession(@Req() req: Request) {
    try {
      return await firstValueFrom(
        this.authentication.send('session.getOne', {
          sessionId: (req.user as any).sessionId,
          userId: (req.user as any)._id,
        }),
      );
    } catch (err: any) {
      const error = err?.error || err;

      console.log('error handling =>', error);

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

  // DELETE /session/:id
  @Delete(':id')
  async deleteSession(@Req() req: Request, @Param('id') id: string) {
    try {
      return await firstValueFrom(
        this.authentication.send('session.delete', {
          sessionId: id,
          userId: (req.user as any)._id,
        }),
      );
    } catch (err: any) {
      const error = err?.error || err;

      console.log('error handling =>', error);

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
}
