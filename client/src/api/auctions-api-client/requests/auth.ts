import {
  AuthDto,
  AuthResponseDto,
  GoogleAuthDto,
  RegisterResponseDto,
} from '@/src/api/dto/auth.dto';
import { auctionsApiClient } from '@/src/api/auctions-api-client/api';

type AuthResponse = Pick<AuthResponseDto, 'user'>;

export const login = (params: AuthDto) =>
  auctionsApiClient.post<AuthResponse>('/auth/login', params);

export const logout = () => auctionsApiClient.post('/auth/logout');

export const register = (params: AuthDto) =>
  auctionsApiClient.post<RegisterResponseDto>('/auth/register', params);

export const getGoogleNonce = () => auctionsApiClient.get<{ nonce: string }>('/auth/google/nonce');

export const googleAuth = (body: GoogleAuthDto) =>
  auctionsApiClient.post<AuthResponse>('/auth/google', body);

export const confirmEmail = (code: string) =>
  auctionsApiClient.get<{ status: string }>('/auth/confirm-email', { params: { code } });

export const resendConfirmation = (email: string) =>
  auctionsApiClient.post<{ status: string }>('/auth/resend-confirmation', { email });
