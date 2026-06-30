import { serverFetch } from '@/src/api/serverFetch';
import { nextSessionStorage } from '@/src/services/session/nextSessionStorage';
import type { ConfirmEmailResponseDto } from '@/src/api/dto/auth.dto';
import type { ServerResponse } from '@/src/api/types';

type AuthUserResponse = { user: { id: string; email: string } };

export const fetchGoogleNonceServer = () =>
  serverFetch<{ nonce: string }>('/auth/google/nonce', { skipAuth: true });

export const confirmEmailServer = async (
  code: string
): Promise<ServerResponse<AuthUserResponse>> => {
  const response = await serverFetch<ConfirmEmailResponseDto>('/auth/confirm-email', {
    params: { code },
    skipAuth: true,
  });

  if ('data' in response) {
    await nextSessionStorage.create(response.data);
    return { status: response.status, data: { user: response.data.user } };
  }

  return response;
};
