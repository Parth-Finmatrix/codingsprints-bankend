import { NestFactory } from '@nestjs/core';
import { TutorialsModule } from './tutorials.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { applyToMicroserviceLayer } from '@app/rpc';

async function bootstrap() {
  process.title = 'tutorials';

  const logger = new Logger('tutorialsBootstrap');

  const broker = process.env.KAFKA_BROKER || 'localhost:9092';

  //create an microservices instance
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TutorialsModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId:
            process.env.KAFKA_TUTORIALS_CLIENT_ID || 'tutorials-service',
          brokers: [broker],
        },
        consumer: {
          groupId: process.env.KAFKA_TUTORIALS_GROUP_ID || 'tutorials-group',
        },
      },
    },
  );

  applyToMicroserviceLayer(app);

  app.enableShutdownHooks();
  await app.listen();

  logger.log(`Tutorials Kafka listening via ${broker}`);

  // const app = await NestFactory.create(TutorialsModule);
  // await app.listen(process.env.TUTORIAL_SERVICE_PORT ?? 3000);
}
bootstrap();
