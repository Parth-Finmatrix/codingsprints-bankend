import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET! || 'jwt_secret_key';
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET! || 'jwt_refresh_secret_key';

export const signAccessToken = (payload: object) =>
  jwt.sign(payload, ACCESS_SECRET, { audience: 'user', expiresIn: '1h' });

export const signRefreshToken = (payload: object) =>
  jwt.sign(payload, REFRESH_SECRET, { audience: 'user', expiresIn: '7d' });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET);

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET);
