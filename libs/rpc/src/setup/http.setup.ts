import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAllExceptionFilter } from '../filter/http-exception.filter';
import { RpcSuccessInterceptor } from '../interceptors/success.interceptor';

/* ───────── HTTP / GATEWAY SETUP ───────── */
export function setupHttpApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpAllExceptionFilter());
  app.useGlobalInterceptors(new RpcSuccessInterceptor());
}
