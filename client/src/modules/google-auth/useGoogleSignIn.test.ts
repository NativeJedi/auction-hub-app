// @vitest-environment jsdom
import { describe, it } from 'vitest';

describe('useGoogleSignIn', () => {
  it.todo('sets ready=true once GIS script loads');
  it.todo('sets error when GIS script fails to load');
  it.todo('signIn fetches a fresh nonce from /api/auth/google/nonce on each click');
  it.todo('signIn calls google.accounts.id.initialize with the fetched nonce and the client id');
  it.todo('signIn calls google.accounts.id.prompt after initialize');
  it.todo('GIS callback POSTs { credential, nonce } to /api/auth/google');
  it.todo('on 2xx response, navigates to /crm/auctions');
  it.todo('on 401 response, sets error with the BFF message');
  it.todo('on 5xx response, sets a generic error message');
  it.todo('exposes clientId=null when NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
});
