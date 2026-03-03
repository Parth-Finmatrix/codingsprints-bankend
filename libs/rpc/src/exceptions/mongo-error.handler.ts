import { RpcException } from '@nestjs/microservices';
import { Error as MongooseError } from 'mongoose';
import { ErrorCode } from '../constants/error-code.enum';
import { rpcBadRequest, rpcInternal } from './rpc-exception.helpers';

export function handleMongoRpcError(
  error: any,
  fallbackMessage = 'Internal server error',
): never {
  // 1️⃣ Already RPC → pass through
  if (error instanceof RpcException) {
    throw error;
  }

  // 2️⃣ Mongoose Validation Error
  if (error instanceof MongooseError.ValidationError) {
    const message = Object.values(error.errors)
      .map((e: any) => e.message)
      .join(', ');

    throw rpcBadRequest(message, ErrorCode.VALIDATION_ERROR, error.errors);
  }

  // 3️⃣ Duplicate Key
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const value = error.keyValue?.[field];

    throw rpcBadRequest(
      `${field} "${value}" already exists`,
      ErrorCode.VALIDATION_ERROR,
      error.keyValue,
    );
  }

  // 4️⃣ Cast Error (Invalid ObjectId)
  if (error instanceof MongooseError.CastError) {
    throw rpcBadRequest(
      `${error.path} must be a valid MongoDB ObjectId`,
      ErrorCode.VALIDATION_ERROR,
    );
  }

  // 5️⃣ Unknown Error
  throw rpcInternal(fallbackMessage, error);
}
