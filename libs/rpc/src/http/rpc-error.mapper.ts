import { HttpException } from '@nestjs/common';

export function mapRpcErrorToHttp(err: any): never {
  const payload = err?.error ?? err;

  throw new HttpException(
    {
      success: false,
      message: payload?.message ?? 'Request failed',
      code: payload?.code,
    },
    payload?.httpStatus ?? 500,
  );
}
