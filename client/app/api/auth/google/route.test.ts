import { describe, it } from 'vitest';

describe('POST /api/auth/google', () => {
  it.todo('forwards { credential, nonce } to Nest and returns { user } on success');
  it.todo('creates a session and sets the session cookie on success');
  it.todo('returns 400 when credential is missing from the body');
  it.todo('returns 400 when nonce is missing from the body');
  it.todo('forwards Nest 401 status and error body verbatim');
});
