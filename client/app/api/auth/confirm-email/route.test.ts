// @vitest-environment node
import { describe, it } from 'vitest';

describe('GET /api/auth/confirm-email', () => {
  it.todo('forwards token query param to confirmEmailServer and returns { status }');
  it.todo('forwards a 403 INVALID_CONFIRMATION_TOKEN error from the server verbatim');
  it.todo('returns 500 when token is missing from the request URL');
});
