import { Button } from '@/ui-kit/ui/button';
type ToastType = 'success' | 'error' | 'info';

export type ToastProps = {
  title?: string;
  message: string;
  type?: ToastType;
};

export class Toast {
  readonly id: number;
  readonly title?: string;
  readonly message: string;
  readonly type: ToastType;

  constructor({ title, message, type }: ToastProps) {
    this.id = Date.now();
    this.title = title || '';
    this.message = message;
    this.type = type || 'info';
  }
}

import { X, CheckCircle, XCircle, Info } from 'lucide-react';

export const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
  const icon = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <XCircle className="h-5 w-5 text-destructive" />,
    info: <Info className="h-5 w-5 text-info" />,
  };

  return (
    <div className="flex items-start gap-3 p-4 min-w-[280px] max-w-[340px] bg-card border rounded-lg shadow-md animate-in fade-in">
      <div>{icon[toast.type]}</div>

      <div className="flex-1">
        {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}

        <div className="text-sm text-muted-foreground">{toast.message}</div>
      </div>

      <Button variant="ghost" size="icon" onClick={onDismiss} className="h-6 w-6">
        <X />
      </Button>
    </div>
  );
};
