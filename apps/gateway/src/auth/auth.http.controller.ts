import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  InternalServerErrorException,
  UseGuards,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from 'apps/authentication/src/auth/dto/register.dto';
import { LoginDto } from 'apps/authentication/src/auth/dto/login.dto';
import type { Request, Response } from 'express';
import { VerifyEmailDto } from 'apps/authentication/src/auth/dto/verify-email.dto';
import { ResetPasswordDto } from 'apps/authentication/src/auth/dto/reset-password.dto';
import { HTTPSTATUS } from '@app/rpc/constants/http.status.contant';
import {
  clearAuthenticationCookies,
  setAuthenticationCookies,
  // setAuthenticationCookies,
} from 'apps/authentication/src/common/utils/cookie';
import { rpcInternal, rpcNotFound, rpcUnauthorized } from '@app/rpc';
import { logger } from 'apps/authentication/src/common/utils/logger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { refreshCookieOptions, accessCookieOptions } from './utils/cookie.util';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';

@Controller('api/auth')
export class AuthHttpController {
  constructor(
    @Inject('AUTHENTICATION_CLIENT')
    private readonly authentication: ClientKafka,
  ) {}

  async onModuleInit() {
    this.authentication.subscribeToResponseOf('auth.register');
    this.authentication.subscribeToResponseOf('auth.login');
    this.authentication.subscribeToResponseOf('auth.refresh');
    this.authentication.subscribeToResponseOf('auth.verifyEmail');
    this.authentication.subscribeToResponseOf('auth.forgotPassword');
    this.authentication.subscribeToResponseOf('auth.resetPassword');
    this.authentication.subscribeToResponseOf('auth.logout');
    this.authentication.subscribeToResponseOf('auth.profile');
    this.authentication.subscribeToResponseOf('session.getAll');
    await this.authentication.connect();
  }

  @Get('user-profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    try {
      return req.user;
    } catch (err: any) {
      const error = err?.error || err;

      console.log('profile error handling =>', err);

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

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      return await firstValueFrom(
        this.authentication.send('auth.register', dto),
      );
    } catch (err: any) {
      const error = err?.error || err;

      console.log('my error handling =>', err);

      throw new HttpException(
        {
          success: false,
          message: error?.message || 'Something went wrong',
          code: error?.code,
        },
        error?.httpStatus || 500,
      );
    }

    // return firstValueFrom(this.authentication.send('auth.register', dto));
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const userAgent = req.headers['user-agent'];

      const response = await firstValueFrom(
        this.authentication.send('auth.login', {
          ...dto,
          userAgent,
        }),
      );

      const { user, accessToken, refreshToken, mfaRequired, role } =
        response.data;

      console.log('user =>', user, accessToken, refreshToken, mfaRequired);

      // MFA case
      if (mfaRequired) {
        return {
          success: true,
          message: 'Verify MFA authentication',
          data: {
            userDto: {
              ...user,
              mfaRequired,
              role,
              accessKey: accessToken,
            },
          },
        };
      }

      // Same as setAuthenticationCookies()
      // setAuthenticationCookies({ res, accessToken, refreshToken });
      // res.cookie('accessToken', accessToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'none',
      //   maxAge: 15 * 60 * 1000, // 15 minutes
      // });

      // res.cookie('refreshToken', refreshToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'none',
      //   path: '/auth/refresh',
      //   maxAge: 7 * 24 * 60 * 60 * 1000, //7days
      // });

      res.cookie('accessToken', accessToken, accessCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshCookieOptions);

      return {
        success: true,
        message: 'User login successfully',
        data: {
          userDto: {
            ...user,
            role,
            accessKey: accessToken,
          },
        },
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

  @Get('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      console.log('refresh token from cookies =>', refreshToken);

      if (!refreshToken) {
        throw rpcUnauthorized(
          'Missing refresh token',
          ErrorCode.REFRESH_TOKEN_NOT_FOUND,
        );
      }

      const response = await firstValueFrom(
        this.authentication.send('auth.refresh', refreshToken),
      );

      const { accessToken, newRefreshToken } = response;

      if (newRefreshToken) {
        res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
      }

      res.cookie('accessToken', accessToken, accessCookieOptions);

      return res.status(200).json({
        data: { accessToken, newRefreshToken },
        message: 'Refresh access token successfully',
      });
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

  @Post('verify/email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    try {
      return await firstValueFrom(
        this.authentication.send('auth.verifyEmail', dto),
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

  @Post('password/forgot')
  async forgotPassword(@Body('email') email: string) {
    try {
      return await firstValueFrom(
        this.authentication.send('auth.forgotPassword', email),
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

  @Post('password/reset')
  async reset(@Body() dto: ResetPasswordDto) {
    return await firstValueFrom(
      this.authentication.send('auth.resetPassword', dto),
    );
  }

  @Post('logout')
  // @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      console.log('Request logout =>', req.user);

      const sessionId = (req.user as any).sessionId;
      if (!sessionId) {
        rpcNotFound('Session is invalid.');
      }
      const response = await firstValueFrom(
        this.authentication.send('auth.logout', sessionId),
      );
      res.clearCookie('accessToken', {
        path: '/',
      });
      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh',
      });

      clearAuthenticationCookies(res);

      return res.status(200).json({
        success: true,
        message: 'User logout successfully',
      });
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
