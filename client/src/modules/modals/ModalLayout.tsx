'use client';

import { ReactNode } from 'react';
import {
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/ui-kit/ui/dialog';
import { Button } from '@/ui-kit/ui/button';

type SubmitAction = {
  label: string;
  onClick: () => void;
};

type Props = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  submit: SubmitAction;
};

export function ModalLayout({ title, children, onClose, submit }: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit.onClick} type="submit">
            {submit.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
