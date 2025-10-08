'use client';

import { PropsWithChildren } from 'react';
import { useNotification } from '@/src/modules/notifications/NotifcationContext';

type CopyButtonProps = {
  text: string;
};

const CopyButton = ({ text, children }: PropsWithChildren<CopyButtonProps>) => {
  const { showToast } = useNotification();
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      showToast({
        type: 'success',
        title: 'Copied to clipboard',
        message: 'Invite link has been copied to your clipboard.',
      });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
      >
        {children || 'Copy'}
      </button>
    </div>
  );
};

export default CopyButton;
