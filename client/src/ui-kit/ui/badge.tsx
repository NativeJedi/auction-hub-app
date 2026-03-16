import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/ui-kit/utils';

const badgeVariants = cva(
  'justify-center inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'text-primary bg-primary-foreground',
        info: 'text-info bg-info-foreground',
        error: 'text-destructive bg-destructive-foreground',
        draft: 'bg-muted',
        success: 'text-success bg-success-foreground',
      },
      outline: {
        true: 'border border-current',
      },
      size: {
        sm: 'text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, outline, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, outline }), className)} {...props} />;
}

export { Badge, badgeVariants };
