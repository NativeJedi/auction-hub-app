// @vitest-environment jsdom
import { describe, it } from 'vitest';

describe('GoogleSignInButton', () => {
  it.todo('renders the "Continue with Google" button once GIS has loaded');
  it.todo('button is disabled while GIS is loading');
  it.todo('clicking the button triggers the sign-in flow (nonce → initialize → prompt)');
  it.todo('on successful auth, navigates to /crm/auctions');
  it.todo('on 401 from the BFF, renders the error message above the button');
  it.todo('renders nothing in production when NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
  it.todo('renders a dev-only hint in development when NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
});
