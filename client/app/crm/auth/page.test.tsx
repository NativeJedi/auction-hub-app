import { describe, it } from 'vitest';

describe('AuthPage — register flow', () => {
  it.todo(
    'redirects to /crm/auth?pending=<email> when register resolves with pending_confirmation'
  );
  it.todo('renders CheckEmailView with decoded email when ?pending= is present in the URL');
  it.todo('CheckEmailView shows a Resend button that calls resendConfirmation');
});

describe('AuthPage — login flow', () => {
  it.todo('renders EMAIL_NOT_VERIFIED inline error when login rejects with that code');
  it.todo('shows the Resend link in the EMAIL_NOT_VERIFIED error message');
  it.todo('Resend link calls resendConfirmation with the login form email');
  it.todo('shows success toast when resend resolves');
  it.todo('shows 429 toast when resend rejects with statusCode 429');
});
