// import { ArgumentsHost, Catch } from '@nestjs/common';
// import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
// import { Response } from 'express';
// import { RpcErrorPayload } from './rpc.types';
// import { ErrorCode } from './error-handle/error-code.enum';

import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { ErrorCode } from '../constants/error-code.enum';
import { ArgumentsHost, Catch } from '@nestjs/common';

// // this filter run -> inside the microservice process
// // our payload structure should follow the way that we want

// @Catch()
// export class RpcAllExceptionFilter extends BaseRpcExceptionFilter {
//   catch(exception: any, host: ArgumentsHost) {
//     console.log('expection rpc =>', exception);
//     // Already formatted → pass through
//     if (exception instanceof RpcException) {
//       return super.catch(exception, host);
//     }

//     // const status = exception?.getStatus?.();
//     const ctx = host.switchToHttp();
//     // const response = ctx.getResponse<Response>();

//     if (exception?.getStatus) {
//       return super.catch(
//         new RpcException({
//           code: ErrorCode.INTERNAL_SERVER_ERROR,
//           message: exception.message,
//           httpStatus: exception.getStatus(),
//         }),
//         host,
//       );
//     }

//     const payload: RpcErrorPayload = {
//       code: ErrorCode.INTERNAL_SERVER_ERROR,
//       message: 'Internal error',
//       httpStatus: 500,
//     };

//     return super.catch(new RpcException(payload), host);
//   }
// }

@Catch()
export class RpcAllExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.log('exception rpc =>', exception);

    // 1️⃣ Already RPC → pass through
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }

    // 2️⃣ ValidationPipe / HttpException
    if (exception?.getStatus) {
      const status = exception.getStatus();
      const response = exception.getResponse?.();

      const message = Array.isArray(response?.message)
        ? response.message.join(', ')
        : response?.message || exception.message;

      return super.catch(
        new RpcException({
          code:
            status === 400
              ? ErrorCode.VALIDATION_ERROR
              : ErrorCode.INTERNAL_SERVER_ERROR,
          message,
          details: response,
          httpStatus: status,
        }),
        host,
      );
    }

    // 3️⃣ Unknown error
    return super.catch(
      new RpcException({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        httpStatus: 500,
      }),
      host,
    );
  }
}
