import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express'; // ✅ IMPORTANT
import { RpcErrorPayload } from '../types/rpc-error.types';

@Catch()
export class HttpAllExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // 🔹 RPC Exception
    if (exception instanceof RpcException) {
      const payload = exception.getError() as RpcErrorPayload;

      return res.status(payload.httpStatus ?? 500).json({
        success: false,
        message: payload.message ?? 'Request failed',
        code: payload.code,
      });
    }

    // 🔹 HTTP Exception (Validation, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response: any = exception.getResponse();

      const message = Array.isArray(response?.message)
        ? response.message.join(', ')
        : response?.message || exception.message;

      return res.status(status).json({
        success: false,
        message,
        code: status === 400 ? 'VALIDATION_ERROR' : undefined,
      });
    }

    // 🔹 Unknown Error
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
