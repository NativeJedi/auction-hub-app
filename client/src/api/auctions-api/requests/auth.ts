import {
  AuthDto,
  AuthResponseDto,
  ConfirmEmailResponseDto,
  GoogleAuthDto,
  RegisterResponseDto,
  ResendConfirmationResponseDto,
} from '@/src/api/dto/auth.dto';
import { auctionsAPI } from '@/src/api/auctions-api/api';

export const loginServer = (body: AuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/login', body, { skipAuth: true });

export const logoutServer = () => auctionsAPI.post('/auth/logout');

export const registerServer = (dto: AuthDto) =>
  auctionsAPI.post<RegisterResponseDto>('/auth/register', dto, { skipAuth: true });

export const confirmEmailServer = (code: string) =>
  auctionsAPI.get<ConfirmEmailResponseDto>('/auth/confirm-email', {
    params: { code },
    skipAuth: true,
  });

export const resendConfirmationServer = (email: string) =>
  auctionsAPI.post<ResendConfirmationResponseDto>(
    '/auth/resend-confirmation',
    { email },
    { skipAuth: true }
  );

export const refreshTokenServer = ({ refreshToken }: { refreshToken: string }) =>
  auctionsAPI.post<AuthResponseDto>('/auth/refresh', { refreshToken }, { skipAuth: true });

export const googleNonceServer = () =>
  auctionsAPI.get<{ nonce: string }>('/auth/google/nonce', { skipAuth: true });

export const googleAuthServer = (body: GoogleAuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/google', body, { skipAuth: true });
