import type { Metadata } from 'next';
import React from 'react';

// Bidder rooms are per-auction, invite/token-gated and dynamic — never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RoomLayout({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}
