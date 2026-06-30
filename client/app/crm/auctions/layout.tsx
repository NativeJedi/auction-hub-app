import type { Metadata } from 'next';
import React from 'react';
import HeadedLayout from '@/src/layouts/HeadedLayout';

export const metadata: Metadata = {
  title: 'Auctions',
};

export default function AuctionsLayout({ children }: React.PropsWithChildren) {
  return <HeadedLayout>{children}</HeadedLayout>;
}
