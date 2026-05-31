// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import Hero from './Hero';

describe('Hero', () => {
  it('points the primary CTA at the registration screen — AC-3', () => {
    render(<Hero />);

    expect(screen.getByRole('link', { name: /create your first auction/i })).toHaveAttribute(
      'href',
      '/crm/auth?type=register'
    );
  });

  it('points the secondary CTA at the login screen — AC-3', () => {
    render(<Hero />);

    expect(screen.getByRole('link', { name: 'I already have an account' })).toHaveAttribute(
      'href',
      '/crm/auth'
    );
  });
});
