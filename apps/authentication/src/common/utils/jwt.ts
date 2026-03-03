import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { SessionDocument } from '../../auth/schema/session.schema';
import { UserDocument } from '../../auth/schema/user.schema';
import ms from 'ms';

export type AccessTPayload = {
  userId: UserDocument['_id'];
  sessionId: SessionDocument['_id'];
  role: 'ADMIN' | 'USER';
};

export type RefreshTPayload = {
  userId: UserDocument['_id'];
  sessionId: SessionDocument['_id'];
  role: 'ADMIN' | 'USER';
};

type SignOptsAndSecret = SignOptions & {
  secret: string;
};

// const defaults: SignOptions = {
//   audience: ['user'],
// };

const signDefaults: SignOptions = {
  audience: 'user', // string is safest
};

const verifyDefaults: VerifyOptions = {
  audience: 'user',
};

export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: (process.env.JWT_EXPIRES_IN as ms.StringValue) || '5m',
  secret: process.env.JWT_SECRET || 'jwt_secret_key',
};

export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as ms.StringValue) || '7d',
  secret: process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret_key',
};

export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload,
  options?: SignOptsAndSecret,
) => {
  const { secret, ...opts } = options || accessTokenSignOptions;

  return jwt.sign(payload, secret, {
    ...signDefaults,
    ...opts,
  });
};

export const verifyJwtToken = <TPayload extends object = AccessTPayload>(
  token: string,
  options?: VerifyOptions & { secret?: string },
): { payload?: TPayload; error?: string } => {
  try {
    const { secret = process.env.JWT_SECRET || 'jwt_secret_key', ...opts } =
      options || {};

    const decoded = jwt.verify(token, secret, {
      ...verifyDefaults,
      ...opts,
    });

    if (typeof decoded !== 'object' || decoded === null) {
      return { error: 'Invalid token payload' };
    }

    return { payload: decoded as unknown as TPayload };
  } catch (err: any) {
    return { error: err.message };
  }
};
