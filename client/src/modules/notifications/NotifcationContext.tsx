'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast, ToastItem, ToastProps } from '@/src/modules/notifications/toast';
import { isObjectWithProperty, isString } from '@/src/utils/checkers';

type ShowToast = (toast: ToastProps) => void;
type DismissToast = (id: number) => void;

type NotificationContextType = {
  toasts: Toast[];
  showToast: ShowToast;
  dismissToast: DismissToast;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast: DismissToast = useCallback(
    (id) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [toasts]
  );

  const showToast: ShowToast = useCallback(
    (toast) => {
      const id = Date.now();
      setToasts((prev) => [...prev, new Toast(toast)]);

      setTimeout(() => dismissToast(id), 5000);
    },
    [toasts]
  );

  return (
    <NotificationContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="fixed top-5 right-5 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) throw new Error('useNotification must be used within NotificationProvider');

  return context;
};

export const useErrorNotification = () => {
  const { showToast } = useNotification();

  const handleError = (error: unknown) => {
    if (!isObjectWithProperty(error, 'message')) {
      throw error;
    }
    const { message, name } = error;

    showToast({
      title: isString(name) ? name : '',
      message: isString(message) ? message : 'Unknown error',
      type: 'error',
    });
  };

  return handleError;
};
