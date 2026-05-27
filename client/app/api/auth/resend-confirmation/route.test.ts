// @vitest-environment node
import { describe, it } from 'vitest';

describe('POST /api/auth/resend-confirmation', () => {
  it.todo('forwards email body to resendConfirmationServer and returns { status }');
  it.todo('forwards a 429 RESEND_LIMIT_EXCEEDED error from the server verbatim');
});
