'use client';

import { ReactNode } from 'react';
import { DialogHeader, Dialog, DialogContent, DialogTitle } from '@/ui-kit/ui/dialog';

type Props = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export function ModalLayout({ title, children, onClose }: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
