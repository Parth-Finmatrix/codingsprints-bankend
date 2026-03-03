import {
  INestApplication,
  INestMicroservice,
  ValidationPipe,
} from '@nestjs/common';
import { RpcAllExceptionFilter } from '../filter/rpc-exception.filter';
import { RpcSuccessInterceptor } from '../interceptors/success.interceptor';
import { HttpAllExceptionFilter } from '../filter/http-exception.filter';

export function applyToMicroserviceLayer(app: INestMicroservice) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new RpcAllExceptionFilter());
  app.useGlobalInterceptors(new RpcSuccessInterceptor());
}
