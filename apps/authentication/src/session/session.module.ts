import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schema/user.schema';
import {
  VerificationCode,
  VerificationCodeSchema,
} from '../auth/schema/verification-code.schema';
import { Session, SessionSchema } from '../auth/schema/session.schema';
import { Roles, RoleSchema } from '../Roles/schema/roles.shema';
import { Admin, AdminSchema } from '../auth/schema/admin.schema';

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
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
