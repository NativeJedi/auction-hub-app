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

export const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className="alert shadow-lg flex items-start gap-3 p-4 min-w-[280px] bg-base-100 border rounded-lg animate-fadeIn">
      <div className="flex-shrink-0 text-xl">{icon[toast.type]}</div>
      <div className="flex-1">
        {toast.title && <div className="font-bold">{toast.title}</div>}
        <div>{toast.message}</div>
      </div>
      <button onClick={onDismiss} className="btn btn-ghost btn-sm btn-circle ml-2 self-start">
        ✖️
      </button>
    </div>
  );
};
