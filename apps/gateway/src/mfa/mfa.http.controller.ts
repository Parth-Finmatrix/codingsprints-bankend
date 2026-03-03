import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
  Inject,
  Res,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ClientKafka } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('api/auth/mfa')
export class MfaHttpController {
  constructor(
    @Inject('AUTHENTICATION_CLIENT')
    private readonly authentication: ClientKafka,
  ) {}

  async onModuleInit() {
    this.authentication.subscribeToResponseOf('mfa.setup');
    this.authentication.subscribeToResponseOf('mfa.verify');
    this.authentication.subscribeToResponseOf('mfa.revoke');
    this.authentication.subscribeToResponseOf('mfa.verify-login');
    await this.authentication.connect();
  }

  // GET /mfa/setup
  @Get('setup')
  @UseGuards(JwtAuthGuard)
  async generateSetup(@Req() req: Request) {
    try {
      return await firstValueFrom(
        this.authentication.send('mfa.setup', {
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

  // POST /mfa/verify
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifySetup(@Req() req: Request, @Body() body: any) {
    try {
      return await firstValueFrom(
        this.authentication.send('mfa.verify', {
          userId: (req.user as any)._id,
          code: body.code,
          secretKey: body.secretKey,
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

  // PUT /mfa/revoke
  @Put('revoke')
  @UseGuards(JwtAuthGuard)
  async evoke(@Req() req: Request) {
    try {
      return await firstValueFrom(
        this.authentication.send('mfa.revoke', {
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

  // POST /mfa/verify-login
  @Post('verify-login')
  async verifyLogin(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const response = await firstValueFrom(
        this.authentication.send('mfa.verify-login', {
          email: body.email,
          code: body.code,
          userAgent: req.headers['user-agent'],
        }),
      );

      const { user, accessToken, refreshToken } = response.data;

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        // secure: true,
        // path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        // secure: true,
        // path: '/auth/refresh',
      });

      return {
        message: 'User login successfully',
        data: user,
      };
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
