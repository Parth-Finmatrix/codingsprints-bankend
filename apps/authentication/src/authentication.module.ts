import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { AuthModule } from './auth/auth.module';
import { MultiFactorAuthModule } from './multi-factor-auth/multi-factor-auth.module';
import { SessionModule } from './session/session.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { RolesModule } from './Roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI_AUTHENTICATION as string),
    AuthModule,
    MultiFactorAuthModule,
    SessionModule,
    UserModule,
    RolesModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
