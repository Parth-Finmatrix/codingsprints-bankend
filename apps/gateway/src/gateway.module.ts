import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CategoriesHttpController } from './categories/categories.http.controller';
import { SectionsHttpController } from './sections/sections.http.controller';
import { TechnologiesHttpController } from './technologies/technologies.http.controller';
import { TopicsHttpController } from './topics/topics.http.controller';
import { AuthHttpController } from './auth/auth.http.controller';
import { AuthModule } from './auth/auth.module';
import { SessionHttpController } from './session/session.http.controller';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'TUTORIALS_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId:
              process.env.KAFKA_TUTORIALS_CLIENT_ID ?? 'tutorials-service',
            brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
          },
          consumer: {
            groupId: process.env.KAFKA_TUTORIALS_GROUP_ID || 'tutorials-group',
          },
        },
      },
      // {
      //   name: 'AUTHENTICATION_CLIENT',
      //   transport: Transport.KAFKA,
      //   options: {
      //     client: {
      //       clientId:
      //         process.env.KAFKA_AUTHENTICATION_CLIENT_ID ||
      //         'authentication-service',
      //       brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      //     },
      //     consumer: {
      //       groupId:
      //         process.env.KAFKA_AUTHENTICATION_GROUP_ID ||
      //         'authentication-group',
      //     },
      //   },
      // },
      // {
      //   name: 'TECHNOLOGIES_CLIENT',
      //   transport: Transport.KAFKA,
      //   options: {
      //     client: {
      //       clientId:
      //         process.env.KAFKA_TECHNOLOGIES_CLIENT_ID ??
      //         'technologies-service',
      //       brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      //     },
      //     consumer: {
      //       groupId:
      //         process.env.KAFKA_TECHNOLOGIES_GROUP_ID || 'technologies-group',
      //     },
      //   },
      // },
      // {
      //   name: 'SECTIONS_CLIENT',
      //   transport: Transport.KAFKA,
      //   options: {
      //     client: {
      //       clientId:
      //         process.env.KAFKA_SECTIONS_CLIENT_ID ?? 'sections-service',
      //       brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      //     },
      //     consumer: {
      //       groupId: process.env.KAFKA_SECTIONS_GROUP_ID || 'sections-group',
      //     },
      //   },
      // },
      // {
      //   name: 'TOPICS_CLIENT',
      //   transport: Transport.KAFKA,
      //   options: {
      //     client: {
      //       clientId: process.env.KAFKA_TOPICS_CLIENT_ID ?? 'topics-service',
      //       brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      //     },
      //     consumer: {
      //       groupId: process.env.KAFKA_TOPICS_GROUP_ID || 'topics-group',
      //     },
      //   },
      // },
    ]),
  ],
  controllers: [
    GatewayController,
    CategoriesHttpController,
    SectionsHttpController,
    TechnologiesHttpController,
    TopicsHttpController,
  ],
  providers: [GatewayService],
})
export class GatewayModule {}
