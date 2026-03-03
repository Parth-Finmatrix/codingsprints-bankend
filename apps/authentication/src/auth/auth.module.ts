import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import {
  VerificationCode,
  VerificationCodeSchema,
} from './schema/verification-code.schema';
import { ConfigModule } from '@nestjs/config';
import { Session, SessionSchema } from './schema/session.schema';
import { Roles, RoleSchema } from '../Roles/schema/roles.shema';
import { Admin, AdminSchema } from './schema/admin.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Roles.name, schema: RoleSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
