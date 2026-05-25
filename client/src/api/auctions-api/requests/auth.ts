import { AuthDto, AuthResponseDto, GoogleAuthDto } from '@/src/api/dto/auth.dto';
import { auctionsAPI } from '@/src/api/auctions-api/api';

export const loginServer = (body: AuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/login', body, { skipAuth: true });

export const logoutServer = () => auctionsAPI.post('/auth/logout');

export const registerServer = (dto: AuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/register', dto, { skipAuth: true });

export const refreshTokenServer = ({ refreshToken }: { refreshToken: string }) =>
  auctionsAPI.post<AuthResponseDto>('/auth/refresh', { refreshToken }, { skipAuth: true });

export const googleNonceServer = () =>
  auctionsAPI.get<{ nonce: string }>('/auth/google/nonce', { skipAuth: true });

export const googleAuthServer = (body: GoogleAuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/google', body, { skipAuth: true });
