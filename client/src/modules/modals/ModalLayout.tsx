'use client';

import { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export function ModalLayout({ title, children, onClose }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="fixed inset-0 bg-black/10 transition-opacity duration-200 opacity-0 animate-fadeIn"
        onClick={onClose}
      />

      <div className="modal modal-open z-50">
        <div className="modal-box relative p-6 transition-transform duration-200 transform scale-90 opacity-0 animate-scaleFadeIn">
          {title && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{title}</h3>
              <button
                className="text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
