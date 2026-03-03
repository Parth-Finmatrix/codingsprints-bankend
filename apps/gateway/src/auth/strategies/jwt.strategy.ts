import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { rpcUnauthorized } from '@app/rpc';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('AUTHENTICATION_CLIENT')
    private readonly authentication: ClientKafka,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token =
            req?.cookies?.accessToken ||
            req?.headers?.authorization?.split(' ')[1];

          console.log('jwt from request =>', req?.cookies);

          if (!token) {
            throw rpcUnauthorized(
              'Access token not found lll',
              ErrorCode.ACCESS_TOKEN_NOT_FOUND,
            );
          }
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET || 'jwt_secret_key',
      audience: 'user',
      algorithms: ['HS256'],
    });
  }

  async onModuleInit() {
    this.authentication.subscribeToResponseOf('auth.profile');
    await this.authentication.connect();
  }

  async validate(payload: {
    userId: string;
    sessionId: string;
    role?: string;
  }) {
    // Ask authentication service if user is valid
    const response = await firstValueFrom(
      this.authentication.send('auth.profile', payload.userId),
    );

    if (!response) {
      throw rpcUnauthorized('Invalid token', ErrorCode.RESOURCE_NOT_FOUND);
    }

    return {
      ...response,
      sessionId: payload.sessionId,
      role: payload.role,
    };
  }
}
