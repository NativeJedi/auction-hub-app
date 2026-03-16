import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';

type ConfirmModalProps = {
  title?: string;
  description?: string;
};

const ConfirmModal = ({
  onClose,
  onSubmit,
  title,
  description,
}: ModalControllerProps<void> & ConfirmModalProps) => {
  const submit = {
    label: 'Confirm',
    onClick: () => onSubmit(),
  };

  return (
    <ModalLayout title={title || 'Confirm'} onClose={onClose} submit={submit}>
      <div className="flex flex-col gap-4">
        <p>{description || 'Are you sure?'}</p>
      </div>
    </ModalLayout>
  );
};

export const confirmModal = createModalRenderer<void, ConfirmModalProps>(ConfirmModal);
