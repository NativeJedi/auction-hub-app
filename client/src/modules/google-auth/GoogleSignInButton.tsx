'use client';

import { Loader2 } from 'lucide-react';
import { useGoogleSignIn } from './useGoogleSignIn';

export default function GoogleSignInButton({ promptKey }: { promptKey?: string | null }) {
  const { containerRef, isLoading, error } = useGoogleSignIn(promptKey);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center min-h-10 items-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div
          ref={containerRef}
          data-testid="google-signin-button"
          className="flex justify-center min-h-10"
        />
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive mt-2">
          Google sign-in is unavailable. Please refresh the page or use email login.
        </p>
      ) : null}
    </div>
  );
}
