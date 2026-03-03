import { HttpException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { rpcUnauthorized } from '@app/rpc';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    console.log('handleRequest info =>', info);

    if (info?.name === 'TokenExpiredError') {
      throw rpcUnauthorized(
        'Access token expiredd',
        ErrorCode.ACCESS_TOKEN_EXPIRED,
      );
    }

    if (info?.name === 'JsonWebTokenError') {
      throw rpcUnauthorized(
        'Invalid access token',
        ErrorCode.ACCESS_TOKEN_INVALID,
      );
    }

    if (!user) {
      throw rpcUnauthorized(
        'Access token not found',
        ErrorCode.ACCESS_TOKEN_NOT_FOUND,
      );
    }

    return user;
  }
}
