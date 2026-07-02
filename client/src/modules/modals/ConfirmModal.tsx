import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';

type ConfirmModalProps = {
  title?: string;
  description?: string;
  submitLabel?: string;
};

const ConfirmModal = ({
  onClose,
  onSubmit,
  title,
  description,
  submitLabel,
}: ModalControllerProps<void> & ConfirmModalProps) => {
  const submit = {
    label: submitLabel || 'Confirm',
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
