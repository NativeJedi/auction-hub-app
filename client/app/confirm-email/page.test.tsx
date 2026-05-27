import { describe, it } from 'vitest';

describe('ConfirmEmailPage', () => {
  it.todo('renders the "Confirming your email…" loading state on mount');
  it.todo('calls confirmEmail with the token from the URL query param');
  it.todo('shows a success toast and redirects to /crm/auth when confirmEmail resolves');
  it.todo('shows an error toast and redirects to /crm/auth when confirmEmail rejects');
  it.todo('shows an invalid-link error toast and redirects to /crm/auth when token is missing');
});
