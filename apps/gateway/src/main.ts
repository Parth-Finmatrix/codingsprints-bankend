import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { setupHttpApp } from '@app/rpc/setup/http.setup';

async function bootstrap() {
  process.title = 'gateway';

  const logger = new Logger('GatewayBootstrap');

  const app = await NestFactory.create(GatewayModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // frontend
    credentials: true, // VERY IMPORTANT if using cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(cookieParser());

  setupHttpApp(app);

  app.enableShutdownHooks();

  const port = Number(process.env.GATEWAY_SERVICE_PORT ?? 8000);

  await app.listen(port);

  logger.log(`Gateway running at port ${port}`);
}
bootstrap();
