import type { Metadata } from 'next';
import React from 'react';

// Transactional, token-based confirmation page — not search content.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ConfirmEmailLayout({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}
