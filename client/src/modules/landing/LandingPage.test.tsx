// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import LandingPage from './LandingPage';

describe('LandingPage', () => {
  it('renders the hero, the five ordered auction-flow steps, and the capabilities section — AC-2', () => {
    render(<LandingPage isAuthenticated={false} />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How an auction works' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Built for live sales' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('shows no dashboard shortcut in the header for anonymous visitors — AC-4', () => {
    render(<LandingPage isAuthenticated={false} />);

    expect(screen.queryByRole('link', { name: 'Go to dashboard' })).not.toBeInTheDocument();
  });

  it('threads the authenticated flag into the header as a Go to dashboard shortcut — AC-4', () => {
    render(<LandingPage isAuthenticated />);

    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toBeInTheDocument();
  });
});
