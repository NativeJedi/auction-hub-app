import type { Metadata } from 'next';
import React from 'react';

// Login / registration screen — keep it out of the index so it doesn't compete with the landing.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}
