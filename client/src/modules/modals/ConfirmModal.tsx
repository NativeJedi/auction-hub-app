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
  const handleConfirm = () => {
    onSubmit();
  };

  return (
    <ModalLayout title={title || 'Confirm'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p>{description || 'Are you sure?'}</p>
        <div className="modal-action justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export const confirmModal = createModalRenderer<void, ConfirmModalProps>(ConfirmModal);
