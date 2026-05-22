import React from 'react';
import HeadedLayout from '@/src/layouts/HeadedLayout';

export default function AuctionsLayout({ children }: React.PropsWithChildren) {
  return <HeadedLayout>{children}</HeadedLayout>;
}
