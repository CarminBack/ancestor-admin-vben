import { scryptSync, timingSafeEqual } from 'node:crypto';

import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import { MOCK_USERS } from '~/utils/mock-data';
import {
  forbiddenResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

export default defineEventHandler(async (event) => {
  const { password, username } = await readBody(event);
  if (!password || !username) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Username and password are required',
    );
  }

  const findUser = MOCK_USERS.find((item) => {
    if (
      item.username !== username ||
      typeof password !== 'string' ||
      password.length > 256
    )
      return false;
    if (!process.env.ANCESTOR_ADMIN_HASH) return item.password === password;
    const expected = Buffer.from(process.env.ANCESTOR_ADMIN_HASH, 'hex');
    const actual = scryptSync(
      password,
      process.env.ANCESTOR_ADMIN_SALT || '',
      64,
    );
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  });

  if (!findUser) {
    clearRefreshTokenCookie(event);
    return forbiddenResponse(event, 'Username or password is incorrect.');
  }

  const { password: _password, ...safeUser } = findUser;
  const accessToken = generateAccessToken(safeUser as typeof findUser);
  const refreshToken = generateRefreshToken(safeUser as typeof findUser);

  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    ...safeUser,
    accessToken,
  });
});
