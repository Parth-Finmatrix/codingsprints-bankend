import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class RpcSuccessInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((response) => {
        // Already wrapped
        if (response?.success !== undefined) {
          return response;
        }

        const message =
          response?.message || response?.data?.message || 'Request successful';

        // 🔥 remove message from data
        let data = response?.data ?? response;
        if (data && typeof data === 'object' && 'message' in data) {
          const { message, ...rest } = data;
          data = rest;
        }

        return {
          success: true,
          message,
          data,
        };
      }),
    );
  }
}
