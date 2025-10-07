'use client';

import { createRoot } from 'react-dom/client';
import { ReactElement } from 'react';

type CloseResult = { result: 'closed' };

type SubmitResult<T> = { result: 'submitted'; data: T };

type ShowModalResult<T> = CloseResult | SubmitResult<T>;

type ShowModal<T, P> = (props?: P) => Promise<ShowModalResult<T>>;

type OnSubmit<T> = (data?: T) => void;

type OnClose = () => void;

export type ModalControllerProps<T = undefined> = {
  onClose: OnClose;
  onSubmit: OnSubmit<T>;
};

type ModalController<T, P> = {
  show: ShowModal<T, P>;
};

const createContainer = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const cleanup = () => {
    if (root) {
      root.unmount();
    }
  };

  return { root, cleanup };
};

type ModalElement<T, P> = (props: P & ModalControllerProps<T>) => ReactElement;

export function createModalRenderer<T = undefined, P = undefined>(
  Modal: ModalElement<T, P>
): ModalController<T, P> {
  const show: ShowModal<T, P> = (props) =>
    new Promise<ShowModalResult<T>>((resolve) => {
      const { root, cleanup } = createContainer();

      const handleClose: OnClose = () => {
        cleanup();
        resolve({ result: 'closed' });
      };

      const handleSubmit: OnSubmit<T> = (data) => {
        cleanup();
        resolve({ result: 'submitted', data: data as T });
      };

      const modalProps = {
        ...(props as P),
        onClose: handleClose,
        onSubmit: handleSubmit,
      };

      root.render(<Modal {...modalProps} />);
    });

  return {
    show,
  };
}
