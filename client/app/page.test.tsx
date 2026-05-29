// @vitest-environment jsdom
import { describe, it } from 'vitest';

// Scaffold — filled in by sdlc-tests.
// RootPage is an async Server Component that reads the session cookie via
// cookies() and renders <LandingPage isAuthenticated={...} />. Tests mock
// next/headers cookies() to return a present / absent session value.
describe('RootPage', () => {
  it.todo('renders the landing page (not a redirect) for an unauthenticated request — AC-1');
  it.todo(
    'renders the landing page with isAuthenticated=true when a session cookie is present — AC-4'
  );
});
