import { AuthDto, AuthResponseDto } from '@/src/api/dto/auth.dto';
import { apiClient } from '@/src/api/clients/api-client';

type AuthResponse = Pick<AuthResponseDto, 'user'>;

export const login = (params: AuthDto) => apiClient.post<AuthResponse>('/auth/login', params);

export const logout = () => apiClient.post('/auth/logout');

export const register = (params: AuthDto) => apiClient.post<AuthResponse>('/auth/register', params);

export const refreshToken = () => apiClient.post<AuthResponse>('/auth/refresh');
