// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import LandingHeader from './LandingHeader';

describe('LandingHeader', () => {
  it('shows Log in and Get started controls for an anonymous visitor — AC-3', () => {
    render(<LandingHeader isAuthenticated={false} />);

    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to dashboard' })).not.toBeInTheDocument();
  });

  it('points the anonymous CTAs at the login and registration screens — AC-3', () => {
    render(<LandingHeader isAuthenticated={false} />);

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/crm/auth');
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute(
      'href',
      '/crm/auth?type=register'
    );
  });

  it('replaces the auth CTAs with a single Go to dashboard control when authenticated — AC-4', () => {
    render(<LandingHeader isAuthenticated />);

    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute(
      'href',
      '/crm/auctions'
    );
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Get started' })).not.toBeInTheDocument();
  });
});
