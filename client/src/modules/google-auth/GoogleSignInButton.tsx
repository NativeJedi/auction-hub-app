'use client';

import { useGoogleSignIn } from './useGoogleSignIn';

export default function GoogleSignInButton() {
  const { containerRef, error } = useGoogleSignIn();

  return (
    <div>
      <div
        ref={containerRef}
        data-testid="google-signin-button"
        className="flex justify-center min-h-10"
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive mt-2">
          Google sign-in is unavailable. Please refresh the page or use email login.
        </p>
      ) : null}
    </div>
  );
}
