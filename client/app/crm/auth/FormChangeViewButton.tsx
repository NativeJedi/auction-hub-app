'use client';

import { Button } from '@/ui-kit/ui/button';

const FormChangeViewButton = ({
  label,
  children,
  onClick,
}: React.PropsWithChildren<{ label: string; onClick: () => void }>) => (
  <p className="text-center text-base-content mt-2">
    <span>{label}</span>
    <Button onClick={onClick} variant="link">
      {children}
    </Button>
  </p>
);

export default FormChangeViewButton;
