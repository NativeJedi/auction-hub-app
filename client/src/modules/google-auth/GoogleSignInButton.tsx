'use client';

import { Button } from '@/ui-kit/ui/button';
import { useGoogleSignIn } from './useGoogleSignIn';

const GoogleGIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 18 18"
    width="16"
    height="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.32z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.88 11.42 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"
    />
  </svg>
);

export default function GoogleSignInButton() {
  const { clientId, ready, signIn } = useGoogleSignIn();

  if (!clientId) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <p className="text-sm text-destructive mb-2">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled.
        </p>
      );
    }
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full mb-4"
      disabled={!ready}
      onClick={signIn}
    >
      <GoogleGIcon />
      Continue with Google
    </Button>
  );
}
