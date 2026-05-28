'use client';

import Link from 'next/link';
import { Button } from '@/ui-kit/ui/button';

const ChangeFormViewButton = ({
  label,
  children,
  href,
}: React.PropsWithChildren<{ label: string; href: string }>) => (
  <p className="text-center text-base-content mt-2">
    <span>{label}</span>
    <Button asChild variant="link">
      <Link href={href}>{children}</Link>
    </Button>
  </p>
);

export default ChangeFormViewButton;
