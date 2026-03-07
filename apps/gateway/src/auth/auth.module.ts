import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthHttpController } from './auth.http.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { SessionHttpController } from '../session/session.http.controller';
import { MfaHttpController } from '../mfa/mfa.http.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'jwt_secret_key', // 🔴 SAME AS signJwtToken
    }),

    ClientsModule.register([
      {
        name: 'AUTHENTICATION_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId:
              process.env.KAFKA_AUTHENTICATION_CLIENT_ID ||
              'authentication-service',
            brokers: [process.env.KAFKA_BROKER ?? 'kafka:9092'],
          },
          consumer: {
            groupId:
              process.env.KAFKA_AUTHENTICATION_GROUP_ID ||
              'authentication-group',
          },
        },
      },
    ]),
  ],
  controllers: [AuthHttpController, SessionHttpController, MfaHttpController],
  providers: [JwtStrategy],
})
export class AuthModule {}
