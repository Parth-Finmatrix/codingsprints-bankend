import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import mongoose, { Connection, Model } from 'mongoose';
import { sendEmail } from '../common/mailers/mailer';
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from '../common/mailers/templates/template';
import { VerificationEnum } from '../common/enums/verification-code.enum';
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from '../common/utils/date-time';
import {
  VerificationCode,
  VerificationCodeDocument,
} from './schema/verification-code.schema';
import {
  rpcBadRequest,
  rpcForbidden,
  rpcInternal,
  rpcNotFound,
  rpcUnauthorized,
} from '@app/rpc';
import { logger } from '../common/utils/logger';
import { Session, SessionDocument } from './schema/session.schema';
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from '../common/utils/jwt';
import { HTTPSTATUS } from '@app/rpc/constants/http.status.contant';
import { ErrorCode } from '@app/rpc/constants/error-code.enum';
import { hashValue } from '../common/utils/bcrypt';
import { Roles, RolesDocument } from '../Roles/schema/roles.shema';
import { Admin, AdminDocument } from './schema/admin.schema';
import {
  signAccessToken,
  signRefreshToken,
} from 'apps/gateway/src/auth/utils/jwt.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: Model<UserDocument>,
    @InjectModel(VerificationCode.name)
    private readonly VerificationCodeModel: Model<VerificationCodeDocument>,
    @InjectModel(Session.name)
    private readonly SessionModel: Model<SessionDocument>,
    @InjectModel(Roles.name)
    private readonly RolesModel: Model<RolesDocument>,
    @InjectModel(Admin.name)
    private readonly AdminModel: Model<AdminDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async getProfile(userId: string) {
    return this.UserModel.findById(userId, { password: 0 }).lean();
  }

  async register(registerData: RegisterDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    logger.info('register session start...');

    try {
      const { name, email, password, IsAgree, role = 'USER' } = registerData;

      const roleDoc = await this.RolesModel.findOne({ name: role }).session(
        session,
      );
      if (!roleDoc) {
        logger.error('Invalid role provided', 403);
        throw rpcForbidden('Invalid role provided');
      }

      const existingUser = await this.UserModel.exists({
        email,
      }).session(session);

      if (existingUser) {
        logger.error('User already exists with this email', 403);
        throw rpcForbidden('User already exists with this email');
      }

      console.log('user  1 =>', name, email, password, IsAgree, role);

      let adminDoc;

      if (role === 'ADMIN') {
        const adminCount =
          await this.AdminModel.countDocuments().session(session);

        if (adminCount >= 1) {
          logger.error('Only one admin is allowed');
          rpcBadRequest('Only one admin is allowed');
        }

        adminDoc = await this.AdminModel.create(
          [
            {
              name,
              email,
              role: roleDoc._id,
              password,
            },
          ],
          { session },
        );

        logger.info(`admin created....`, { adminId: adminDoc[0]._id });
      }

      const newUser = await this.UserModel.create(
        [
          {
            name,
            email,
            password,
            role: roleDoc._id,
            IsAgree,
            admin: role === 'ADMIN' && adminDoc[0]._id,
          },
        ],
        { session },
      );

      const userId = newUser[0]._id;
      logger.info(`New User created....`, { userId });

      const verification = await this.VerificationCodeModel.create(
        [
          {
            userId,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: fortyFiveMinutesFromNow(),
          },
        ],
        { session },
      );

      // Sending verification email link
      const verificationUrl = `${process.env.APP_ORIGIN}/auth/confirm-account?code=${verification[0].code}`;
      const emailResult = await sendEmail({
        to: newUser[0].email,
        ...verifyEmailTemplate(verificationUrl),
      });

      // logger.info(`✅ Email sented: ${emailResult.data?.id}`);
      logger.info(`✅ Email sended:`, { emailId: emailResult.data?.id });

      await session.commitTransaction();
      session.endSession();

      logger.info(`register session end....`);

      const details = {
        registerDto: newUser[0],
      };

      logger.info(`User registered successfully....`);
      return {
        data: details,
        message: 'User registered successfully',
        code: HTTPSTATUS.CREATED,
      };
    } catch (err) {
      /** 🔥 Rollback */
      await session.abortTransaction();
      session.endSession();

      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    } finally {
      session.endSession();
      logger.info(`register session end....`);
    }
  }

  async login(loginData: LoginDto) {
    try {
      const { email, password, userAgent } = loginData;

      /** 1️⃣ Find user */
      const user = await this.UserModel.findOne({ email });
      if (!user) {
        throw rpcBadRequest(
          'Invalid credentials',
          ErrorCode.AUTH_USER_NOT_FOUND,
          401,
        );
      }

      /** 2️⃣ Validate password */
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw rpcBadRequest(
          'Invalid credentials',
          ErrorCode.AUTH_USER_NOT_FOUND,
          401,
        );
      }

      /** 3️⃣ Resolve role */
      // const roleName = (user.role as any).name;
      const role = await this.RolesModel.findById(user.role);
      if (!role) {
        throw rpcForbidden('Role not found', ErrorCode.ACCESS_FORBIDDEN);
      }

      console.log('-----', user, email, password, userAgent, isValid);

      /** 4️⃣ Handle 2FA (unchanged) */
      if (user.userPreferences?.enable2FA) {
        return {
          data: {
            user,
            mfaRequired: true,
            accessToken: '',
            refreshToken: '',
          },
        };
      }

      /** 5️⃣ Create session */
      const session = await this.SessionModel.create({
        userId: user._id,
        roleId: user.role,
        userAgent,
      });

      console.log('login seccess =>', session);

      /** 6️⃣ JWT payload and Tokens*/
      const accessToken = signAccessToken({
        userId: session.userId,
        sessionId: session._id,
        role: role.name,
      });

      console.log('accessToken =>', accessToken);

      // const refreshToken = signJwtToken(
      //   {
      //     userId: session.userId,
      //     sessionId: session._id,
      //     role: role.name,
      //   },
      //   refreshTokenSignOptions,
      // );

      const refreshToken = signRefreshToken({
        userId: session.userId,
        sessionId: session._id,
        role: role.name,
      });

      console.log(
        'user => 1 => ',
        user,
        email,
        password,
        userAgent,
        isValid,
        session,
        accessToken,
        refreshToken,
      );

      return {
        data: {
          user,
          accessToken,
          refreshToken,
          mfaRequired: false,
          role: role.name,
        },
      };
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const { payload, error } = verifyJwtToken<RefreshTPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret,
      });

      if (!payload || error) {
        throw rpcUnauthorized('Invalid refresh token');
      }

      const session = await this.SessionModel.findById(payload.sessionId);
      const now = Date.now();

      if (!session) {
        throw rpcUnauthorized('Session does not exist');
      }

      if (session.expiredAt.getTime() <= now) {
        throw rpcUnauthorized('Session expired');
      }

      const shouldRotate = session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

      if (shouldRotate) {
        session.expiredAt = calculateExpirationDate(
          process.env.JWT_REFRESH_EXPIRES_IN,
        );
        await session.save();
      }

      const role = await this.RolesModel.findById(session.roleId);
      if (!role) {
        throw rpcForbidden('Role not found');
      }

      const accessToken = signAccessToken({
        userId: session.userId,
        sessionId: session._id,
        role: role.name,
      });

      const newRefreshToken = shouldRotate
        ? signRefreshToken({
            userId: session.userId,
            sessionId: session._id,
            role: role.name,
          })
        : undefined;

      return {
        accessToken,
        newRefreshToken,
      };
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    }
  }

  async verifyEmail(code: string) {
    try {
      const validCode = await this.VerificationCodeModel.findOne({
        code: code,
        type: VerificationEnum.EMAIL_VERIFICATION,
        expiresAt: { $gt: new Date() },
      });

      if (!validCode) {
        throw rpcBadRequest('Invalid or expired verification code');
      }

      const updatedUser = await this.UserModel.findByIdAndUpdate(
        validCode.userId,
        {
          isEmailVerified: true,
        },
        { new: true },
      );

      if (!updatedUser) {
        throw rpcBadRequest('Unable to verify email address');
      }

      await validCode.deleteOne();

      const details = {
        verifyEmailDto: {
          user: updatedUser,
        },
      };
      return {
        message: 'Email verified successfully',
        data: details,
        code: 200,
      };
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.UserModel.findOne({
        email: email,
      });

      if (!user) {
        throw rpcNotFound('User not found');
      }

      //check mail rate limit is 2 emails per 3 or 10 min
      const timeAgo = threeMinutesAgo();
      const maxAttempts = 2;

      const count = await this.VerificationCodeModel.countDocuments({
        userId: user._id,
        type: VerificationEnum.PASSWORD_RESET,
        createdAt: { $gt: timeAgo },
      });

      if (count >= maxAttempts) {
        throw new HttpException(
          'Too many request, try again later',
          HTTPSTATUS.TOO_MANY_REQUESTS,
        );
      }

      const expiresAt = anHourFromNow();
      const validCode = await this.VerificationCodeModel.create({
        userId: user._id,
        type: VerificationEnum.PASSWORD_RESET,
        expiresAt,
      });

      const resetLink = `${process.env.APP_ORIGIN}/auth/reset-password?code=${
        validCode.code
      }&exp=${expiresAt.getTime()}`;

      const { data, error } = await sendEmail({
        to: user.email,
        ...passwordResetTemplate(resetLink),
      });

      if (!data?.id) {
        throw rpcInternal(`${error?.name} ${error?.message}`);
      }

      // return {
      //   url: resetLink,
      //   emailId: data.id,
      // };
      const details = {
        forgotPasswordDto: {
          url: resetLink,
          emailId: data.id,
        },
      };

      return {
        message: 'Password reset email sent',
        data: details,
        code: 200,
      };
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { password, verificationCode } = resetPasswordDto;
      const validCode = await this.VerificationCodeModel.findOne({
        code: verificationCode,
        type: VerificationEnum.PASSWORD_RESET,
        expiresAt: { $gt: new Date() },
      });

      if (!validCode) {
        throw rpcNotFound('Invalid or expired verification code');
      }

      const hashedPassword = await hashValue(password);

      const updatedUser = await this.UserModel.findByIdAndUpdate(
        validCode.userId,
        {
          password: hashedPassword,
        },
      );

      if (!updatedUser) {
        throw rpcBadRequest('Failed to reset password!');
      }

      await validCode.deleteOne();

      await this.SessionModel.deleteMany({
        userId: updatedUser._id,
      });

      // return {
      //   user: updatedUser,
      // };

      const details = {
        resetPasswordDto: {
          user: updatedUser,
        },
      };

      return {
        message: 'Reset Password successfully',
        data: details,
        code: 200,
      };
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    }
  }

  async logout(sessionId: string) {
    try {
      return await this.SessionModel.findByIdAndDelete(sessionId);
    } catch (err) {
      if (err instanceof RpcException) {
        throw err;
      }

      rpcInternal('Internal Server Error', err);
    }
  }
}
