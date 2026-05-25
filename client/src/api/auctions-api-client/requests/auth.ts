import { AuthDto, AuthResponseDto, GoogleAuthDto } from '@/src/api/dto/auth.dto';
import { auctionsApiClient } from '@/src/api/auctions-api-client/api';

type AuthResponse = Pick<AuthResponseDto, 'user'>;

export const login = (params: AuthDto) =>
  auctionsApiClient.post<AuthResponse>('/auth/login', params);

export const logout = () => auctionsApiClient.post('/auth/logout');

export const register = (params: AuthDto) =>
  auctionsApiClient.post<AuthResponse>('/auth/register', params);

export const getGoogleNonce = () => auctionsApiClient.get<{ nonce: string }>('/auth/google/nonce');

export const googleAuth = (body: GoogleAuthDto) =>
  auctionsApiClient.post<AuthResponse>('/auth/google', body);
