// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPush, mockShowToast, mockConfirmEmail, mockUseQueryParam } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockShowToast: vi.fn(),
  mockConfirmEmail: vi.fn(),
  mockUseQueryParam: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useNotification: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/src/api/auctions-api-client/requests/auth', () => ({
  confirmEmail: mockConfirmEmail,
}));

vi.mock('@/src/utils/url', () => ({
  useQueryParam: mockUseQueryParam,
}));

import ConfirmEmailPage from './page';

describe('ConfirmEmailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the loading spinner on mount', () => {
    // The component always shows a spinner while the confirmation request is in-flight
    mockUseQueryParam.mockReturnValue('some-token');
    mockConfirmEmail.mockReturnValue(new Promise(() => {})); // never resolves

    const { container } = render(<ConfirmEmailPage />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('calls confirmEmail with the token from the URL query param', async () => {
    // AC#2: page extracts the token from ?token= and forwards it to the API
    mockUseQueryParam.mockReturnValue('abc123');
    mockConfirmEmail.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 'u-1', email: 'a@b.com' },
    });

    render(<ConfirmEmailPage />);

    await waitFor(() => expect(mockConfirmEmail).toHaveBeenCalledWith('abc123'));
  });

  it('redirects to /crm/auctions when confirmEmail resolves (auto-login after confirmation)', async () => {
    // AC#2: successful confirmation auto-logs the user in and lands them on the CRM
    mockUseQueryParam.mockReturnValue('valid-token');
    mockConfirmEmail.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 'u-1', email: 'a@b.com' },
    });

    render(<ConfirmEmailPage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/crm/auctions'));
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('shows an error toast and redirects to /crm/auth when confirmEmail rejects', async () => {
    // FR-3: expired or invalid token must surface a clear error and redirect to login
    mockUseQueryParam.mockReturnValue('expired-token');
    mockConfirmEmail.mockRejectedValue(new Error('token expired'));

    render(<ConfirmEmailPage />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'The confirmation link is invalid or has expired.',
      });
      expect(mockPush).toHaveBeenCalledWith('/crm/auth');
    });
  });

  it('shows an error toast and redirects to /crm/auth when token is missing from the URL', async () => {
    // FR-3: a confirmation link with no token must be rejected immediately
    mockUseQueryParam.mockReturnValue(null);

    render(<ConfirmEmailPage />);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Confirmation link is invalid.',
      });
      expect(mockPush).toHaveBeenCalledWith('/crm/auth');
    });
    expect(mockConfirmEmail).not.toHaveBeenCalled();
  });
});
