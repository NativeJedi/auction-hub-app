// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseGoogleSignIn } = vi.hoisted(() => ({
  mockUseGoogleSignIn: vi.fn(),
}));

vi.mock('./useGoogleSignIn', () => ({
  useGoogleSignIn: mockUseGoogleSignIn,
}));

import GoogleSignInButton from './GoogleSignInButton';

const setHookReturn = (
  over: Partial<{
    error: unknown;
  }> = {},
) => {
  mockUseGoogleSignIn.mockReturnValue({
    containerRef: { current: null },
    error: null,
    ...over,
  });
};

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the container that GIS will mount the native button into', () => {
    setHookReturn();

    render(<GoogleSignInButton />);

    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
  });

  it('renders an inline error message when the hook reports an error', () => {
    setHookReturn({ error: new Error('boom') });

    render(<GoogleSignInButton />);

    expect(screen.getByRole('alert')).toHaveTextContent(/google sign-in is unavailable/i);
  });

  it('does not render an error message when the hook reports no error', () => {
    setHookReturn({ error: null });

    render(<GoogleSignInButton />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
