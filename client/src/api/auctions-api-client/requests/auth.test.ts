import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('@/src/api/auctions-api-client/api', () => ({
  auctionsApiClient: { get: mockGet, post: mockPost },
}));

import { confirmEmail, resendConfirmation } from './auth';

describe('confirmEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /auth/confirm-email with the code as a query param and returns { status }', async () => {
    // AC#2: client calls the correct endpoint with the opaque confirmation code
    mockGet.mockResolvedValue({ status: 'confirmed' });

    const result = await confirmEmail('my-code');

    expect(mockGet).toHaveBeenCalledWith('/auth/confirm-email', {
      params: { code: 'my-code' },
    });
    expect(result).toEqual({ status: 'confirmed' });
  });
});

describe('resendConfirmation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls POST /auth/resend-confirmation with { email } body and returns { status }', async () => {
    // AC#4: client calls the correct endpoint to resend the confirmation email
    mockPost.mockResolvedValue({ status: 'email_sent' });

    const result = await resendConfirmation('user@example.com');

    expect(mockPost).toHaveBeenCalledWith('/auth/resend-confirmation', {
      email: 'user@example.com',
    });
    expect(result).toEqual({ status: 'email_sent' });
  });
});
