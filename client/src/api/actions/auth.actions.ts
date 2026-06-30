'use server';

import {
  AuthDto,
  AuthResponseDto,
  GoogleAuthDto,
  RegisterResponseDto,
  ResendConfirmationResponseDto,
} from '@/src/api/dto/auth.dto';
import { serverFetch } from '@/src/api/serverFetch';
import type { ServerResponse } from '@/src/api/types';
import { nextSessionStorage } from '@/src/services/session/nextSessionStorage';

type AuthUserResponse = Pick<AuthResponseDto, 'user'>;

export const loginAction = async (body: AuthDto): Promise<ServerResponse<AuthUserResponse>> => {
  const response = await serverFetch<AuthResponseDto>('/auth/login', {
    method: 'POST',
    body,
    skipAuth: true,
  });

  if ('data' in response) {
    await nextSessionStorage.create(response.data);
    return { status: response.status, data: { user: response.data.user } };
  }

  return response;
};

export const registerAction = async (body: AuthDto): Promise<ServerResponse<RegisterResponseDto>> =>
  serverFetch<RegisterResponseDto>('/auth/register', {
    method: 'POST',
    body,
    skipAuth: true,
  });

export const logoutAction = async (): Promise<ServerResponse<null>> => {
  const session = await nextSessionStorage.getValidSession();

  if (!session) {
    return { status: 401, message: 'User is not authorized', reason: 'UNAUTHORIZED' };
  }

  const response = await serverFetch<null>('/auth/logout', { method: 'POST' });

  if ('data' in response) {
    await nextSessionStorage.delete();
  }

  return response;
};

export const resendConfirmationAction = async (
  email: string
): Promise<ServerResponse<ResendConfirmationResponseDto>> =>
  serverFetch<ResendConfirmationResponseDto>('/auth/resend-confirmation', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });

export const googleAuthAction = async (
  body: GoogleAuthDto
): Promise<ServerResponse<AuthUserResponse>> => {
  const response = await serverFetch<AuthResponseDto>('/auth/google', {
    method: 'POST',
    body,
    skipAuth: true,
  });

  if ('data' in response) {
    await nextSessionStorage.create(response.data);
    return { status: response.status, data: { user: response.data.user } };
  }

  return response;
};
