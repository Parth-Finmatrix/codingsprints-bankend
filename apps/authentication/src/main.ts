import { NestFactory } from '@nestjs/core';
import { AuthenticationModule } from './authentication.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { applyToMicroserviceLayer } from '@app/rpc';

async function bootstrap() {
  // const app = await NestFactory.create(AuthenticationModule);
  // await app.listen(process.env.port ?? 3000);

  process.title = 'authentication';

  const logger = new Logger('tutorialsBootstrap');

  const broker = process.env.KAFKA_BROKER || 'localhost:9092';

  //create an microservices instance
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthenticationModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId:
            process.env.KAFKA_AUTHENTICATION_CLIENT_ID ||
            'authentication-service',
          brokers: [broker],
        },
        consumer: {
          groupId:
            process.env.KAFKA_AUTHENTICATION_GROUP_ID || 'authentication-group',
        },
      },
    },
  );

  applyToMicroserviceLayer(app);

  app.enableShutdownHooks();
  await app.listen();

  logger.log(`Authentication Kafka listening via ${broker}`);
}
bootstrap();
