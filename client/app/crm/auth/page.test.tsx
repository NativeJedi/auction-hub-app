// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockPush,
  mockShowToast,
  mockHandleError,
  mockRegister,
  mockLogin,
  mockResendConfirmation,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockShowToast: vi.fn(),
  mockHandleError: vi.fn(),
  mockRegister: vi.fn(),
  mockLogin: vi.fn(),
  mockResendConfirmation: vi.fn(),
}));

// queryParams is mutated per-test to simulate different URL states
const queryParams: Record<string, string | null> = {};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/src/utils/url', () => ({
  useQueryParam: (name: string) => queryParams[name] ?? null,
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useNotification: () => ({ showToast: mockShowToast }),
  useErrorNotification: () => mockHandleError,
}));

vi.mock('@/src/api/auctions-api-client/requests/auth', () => ({
  register: mockRegister,
  login: mockLogin,
  resendConfirmation: mockResendConfirmation,
}));

vi.mock('@/src/modules/google-auth', () => ({
  GoogleSignInButton: () => null,
}));

vi.mock('@/src/layouts/HeadedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import AuthPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  // reset URL params
  for (const key of Object.keys(queryParams)) delete queryParams[key];
});

describe('AuthPage — register flow', () => {
  it('redirects to /crm/auth?type=confirm&pending=<email> when register resolves with pending_confirmation', async () => {
    // AC-1 / FR-6: post-registration redirect to the "check your inbox" screen
    const user = userEvent.setup();
    queryParams.type = 'register';
    mockRegister.mockResolvedValue({ status: 'pending_confirmation' });

    render(<AuthPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        `/crm/auth?type=confirm&pending=${encodeURIComponent('test@example.com')}`
      )
    );
  });

  it('renders CheckEmailView with decoded email when ?type=confirm&pending= is present in the URL', () => {
    // FR-6 / AC-1: "check your inbox" screen must display the email address the link was sent to
    queryParams.type = 'confirm';
    queryParams.pending = encodeURIComponent('test@example.com');

    render(<AuthPage />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('CheckEmailView shows a Resend button that calls resendConfirmation with the pending email', async () => {
    // AC-4: the resend button must forward the correct email to the API
    const user = userEvent.setup();
    queryParams.type = 'confirm';
    queryParams.pending = encodeURIComponent('test@example.com');
    mockResendConfirmation.mockResolvedValue({ status: 'email_sent' });

    render(<AuthPage />);

    await user.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => expect(mockResendConfirmation).toHaveBeenCalledWith('test@example.com'));
  });
});

describe('AuthPage — login flow', () => {
  it('redirects to the confirm view with the email when login rejects with EMAIL_NOT_VERIFIED', async () => {
    // AC-3 / FR-2: unverified accounts are redirected to the "check your inbox" screen
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({ data: { message: 'EMAIL_NOT_VERIFIED' } });

    render(<AuthPage />); // default type=login

    await user.type(screen.getByLabelText('Email'), 'unverified@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        `/crm/auth?type=confirm&pending=${encodeURIComponent('unverified@example.com')}`
      )
    );
  });

  it('shows success toast when resend confirmation resolves', async () => {
    // AC-4: user can request a new link from the confirm view; success must be acknowledged
    const user = userEvent.setup();
    queryParams.type = 'confirm';
    queryParams.pending = encodeURIComponent('test@example.com');
    mockResendConfirmation.mockResolvedValue({ status: 'email_sent' });

    render(<AuthPage />);

    await user.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    );
  });

  it('shows a rate-limit toast when resend rejects with statusCode 429', async () => {
    // AC-4 / FR-4: 3 resends per hour; 4th attempt must show the correct error message
    const user = userEvent.setup();
    queryParams.type = 'confirm';
    queryParams.pending = encodeURIComponent('test@example.com');
    mockResendConfirmation.mockRejectedValue({ data: { statusCode: 429 } });

    render(<AuthPage />);

    await user.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Too many requests'),
        })
      )
    );
  });
});
