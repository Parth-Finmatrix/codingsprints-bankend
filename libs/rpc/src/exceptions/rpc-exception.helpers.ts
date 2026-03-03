import { RpcException } from '@nestjs/microservices';
import { RpcErrorPayload } from '../types/rpc-error.types';
import { HTTPSTATUS } from '../constants/http.status.contant';
import { ErrorCode } from '../constants/error-code.enum';
import { HttpException } from '@nestjs/common';

function throwRpc(payload: RpcErrorPayload): never {
  throw new RpcException(payload);
}

export const rpcBadRequest = (
  message: string,
  code: ErrorCode = ErrorCode.VALIDATION_ERROR,
  details?: any,
) =>
  throwRpc({
    code,
    message,
    details,
    httpStatus: HTTPSTATUS.BAD_REQUEST,
  });

export const rpcUnauthorized = (
  message = 'Unauthorized',
  code: ErrorCode = ErrorCode.ACCESS_UNAUTHORIZED,
) =>
  throwRpc({
    code,
    message,
    httpStatus: HTTPSTATUS.UNAUTHORIZED,
  });

export const rpcForbidden = (
  message = 'Forbidden',
  code: ErrorCode = ErrorCode.ACCESS_FORBIDDEN,
) =>
  throwRpc({
    code,
    message,
    httpStatus: HTTPSTATUS.FORBIDDEN,
  });

export const rpcNotFound = (
  message = 'Resource not found',
  code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
) =>
  throwRpc({
    code,
    message,
    httpStatus: HTTPSTATUS.NOT_FOUND,
  });

export const rpcInternal = (message = 'Internal server error', details?: any) =>
  throwRpc({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message,
    details,
    httpStatus: HTTPSTATUS.INTERNAL_SERVER_ERROR,
  });
