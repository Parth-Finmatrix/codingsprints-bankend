import { HttpException } from '@nestjs/common';

export function throwHttpFromRpc(err: any): never {
  const error = err?.error || err;

  console.log('error handling =>', error, 'err =>', err);

  throw new HttpException(
    {
      success: false,
      message: error?.message || 'Something went wrong',
      code: error?.code,
    },
    error?.httpStatus || 500,
  );
}
