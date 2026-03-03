import type { CookieOptions, Response } from 'express';
import { calculateExpirationDate } from './date-time';

type CookiePayloadType = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const REFRESH_PATH = `/api/auth/refresh`;

const isProd = process.env.NODE_ENV === 'production';

const defaults: CookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'strict' : 'lax',
  secure: true,
  //secure: config.NODE_ENV === "production" ? true : false,
  //sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
};

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: REFRESH_PATH,
  };
};

export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const expires = calculateExpirationDate(expiresIn);
  return {
    ...defaults,
    expires,
    path: '/',
  };
};

export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken,
}: CookiePayloadType) => {
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
};
export const clearAuthenticationCookies = (res: Response) => {
  res.clearCookie('accessToken', {
    path: '/',
  });
  res.clearCookie('refreshToken', {
    path: '/',
  });
  res.clearCookie('refreshToken', {
    path: REFRESH_PATH,
  });
};
