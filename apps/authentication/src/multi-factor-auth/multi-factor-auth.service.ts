import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schema/user.schema';
import { Session, SessionDocument } from '../auth/schema/session.schema';
import { refreshTokenSignOptions, signJwtToken } from '../common/utils/jwt';
import { Roles, RolesDocument } from '../Roles/schema/roles.shema';
import { rpcForbidden } from '@app/rpc';

@Injectable()
export class MultiFactorAuthService {
  constructor(
    @InjectModel(User.name)
    private readonly UserModel: Model<UserDocument>,
    @InjectModel(Session.name)
    private readonly SessionModel: Model<SessionDocument>,
    @InjectModel(Roles.name)
    private readonly RolesModel: Model<RolesDocument>,
  ) {}

  async generateMFASetup(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (user.userPreferences.enable2FA) {
      return { message: 'MFA already enabled' };
    }

    let secretKey = user.userPreferences.twoFactorSecret;
    if (!secretKey) {
      const secret = speakeasy.generateSecret({ name: 'Squeezy' });
      secretKey = secret.base32;
      user.userPreferences.twoFactorSecret = secretKey;
      await user.save();
    }

    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: user.name,
      issuer: 'squeezy.com',
      encoding: 'base32',
    });

    return {
      message: 'Scan the QR code or use the setup key.',
      secret: secretKey,
      qrImageUrl: await qrcode.toDataURL(url),
    };
  }

  async verifyMFASetup(userId: string, code: string, secretKey: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) throw new UnauthorizedException();

    const valid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: 'base32',
      token: code,
    });

    if (!valid) throw new BadRequestException('Invalid MFA code');

    user.userPreferences.enable2FA = true;
    await user.save();

    return {
      message: 'MFA setup completed successfully',
      userPreferences: { enable2FA: true },
    };
  }

  async revokeMFA(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) throw new UnauthorizedException();

    user.userPreferences.twoFactorSecret = undefined;
    user.userPreferences.enable2FA = false;
    await user.save();

    return {
      message: 'MFA revoked successfully',
      userPreferences: { enable2FA: false },
    };
  }

  async verifyMFAForLogin(code: string, email: string, userAgent?: string) {
    const user = await this.UserModel.findOne({ email });
    if (!user) throw new NotFoundException();

    console.log('verifyMFAForLogin', user);

    const role = await this.RolesModel.findById(user.role);
    if (!role) {
      throw rpcForbidden('Role not found');
    }

    const valid = speakeasy.totp.verify({
      secret: user.userPreferences.twoFactorSecret!,
      encoding: 'base32',
      token: code,
    });

    if (!valid) throw new BadRequestException('Invalid MFA code');

    const session = await this.SessionModel.create({
      userId: user._id,
      roleId: user.role,
      userAgent,
    });

    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session._id,
      role: role.name,
    });

    const refreshToken = signJwtToken(
      {
        userId: session.userId,
        sessionId: session._id,
        role: role.name,
      },
      refreshTokenSignOptions,
    );

    return {
      data: {
        user,
        accessToken,
        refreshToken,
      },
    };
  }
}
