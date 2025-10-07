import { AuthDto, AuthResponseDto } from '@/src/api/dto/auth.dto';
import { auctionsAPI } from '@/src/api/clients/auctions-api';
import { AxiosResponse } from 'axios';

export const loginServer = (body: AuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/login', body);

export const logoutServer = () => auctionsAPI.post('/auth/logout');

export const registerServer = (dto: AuthDto) =>
  auctionsAPI.post<AuthResponseDto>('/auth/register', dto);

export const refreshTokenServer = ({ refreshToken }: { refreshToken: string }) =>
  auctionsAPI.post<AuthResponseDto>('/auth/refresh', { refreshToken });
