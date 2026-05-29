// @vitest-environment jsdom
import { describe, it } from 'vitest';

// Scaffold — filled in by sdlc-tests.
// LandingHeader renders adaptive CTAs from the isAuthenticated prop:
// anonymous → Log in (/crm/auth) + Get started (/crm/auth?type=register);
// authenticated → Go to dashboard (/crm/auctions). Render with both prop values.
describe('LandingHeader', () => {
  it.todo('anonymous variant shows Log in and Get started controls — AC-3');
  it.todo('Log in links to /crm/auth and Get started links to /crm/auth?type=register — AC-3');
  it.todo('authenticated variant shows a single Go to dashboard control — AC-4');
  it.todo('Go to dashboard links to /crm/auctions — AC-4');
});
