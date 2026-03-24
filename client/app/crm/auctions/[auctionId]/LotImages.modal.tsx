'use client';

import { useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@/ui-kit/ui/button';
import { deleteLotImage, uploadLotImages } from '@/src/api/auctions-api-client/requests/lot';
import { Auction } from '@/src/api/dto/auction.dto';
import { Lot, LotImage } from '@/src/api/dto/lot.dto';
import { ModalLayout } from '@/src/modules/modals/ModalLayout';
import { createModalRenderer, ModalControllerProps } from '@/src/modules/modals/modalRenderer';
import { DialogFooter } from '@/ui-kit/ui/dialog';

type ModalProps = {
  lot: Lot;
  auctionId: Auction['id'];
  onError: (error: unknown) => void;
};

type ModalResult = {
  uploadedCount: number;
};

type Props = ModalControllerProps<ModalResult, ModalProps>;

const LotImagesModal = ({ lot, auctionId, onClose, onSubmit, onError }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (!files.length) return;

    try {
      setLoading(true);

      await uploadLotImages(auctionId, lot.id, files);

      onSubmit({ uploadedCount: 0 });
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);

      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (image: LotImage) => {
    try {
      setLoading(true);
      await deleteLotImage(auctionId, lot.id, image.id);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalLayout onClose={onClose} title={`${lot.name} — Images`}>
      <div className="flex flex-wrap gap-3 min-h-[100px]">
        {lot.images.length === 0 && (
          <p className="text-sm text-muted-foreground w-full text-center py-6">No images yet</p>
        )}

        {lot.images.map((image) => (
          <div key={image.id} className="relative group w-20 h-20">
            <img
              src={image.url}
              alt={lot.name}
              className="object-cover rounded-md border w-full h-full"
            />
            {/* TODO: fix image loading */}
            {/*<Image src={image.url} alt={lot.name} fill className="object-cover rounded-md border" />*/}
            <button
              disabled={loading}
              onClick={() => handleDelete(image)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button className="w-full" loading={loading} onClick={() => inputRef.current?.click()}>
          <Upload />
          Upload images
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </DialogFooter>
    </ModalLayout>
  );
};

const lotImagesModal = createModalRenderer<ModalResult, ModalProps>(LotImagesModal);

export { lotImagesModal };
