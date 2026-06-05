'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@/ui-kit/ui/button';
import { deleteLotImage, uploadLotImages } from '@/src/api/auctions-api-client/requests/lots';
import { Auction } from '@/src/api/dto/auction.dto';
import { Lot, LotImage } from '@/src/api/dto/lot.dto';
import { DialogFooter } from '@/ui-kit/ui/dialog';

type Props = {
  lot: Lot;
  auctionId: Auction['id'];
  onError: (error: unknown) => void;
  onDirtyChange: (isDirty: boolean) => void;
};

const addImages = (images: LotImage[]) => (prev: LotImage[]) => [...prev, ...images];

const removeImageById = (id: LotImage['id']) => (images: LotImage[]) =>
  images.filter(({ id: imageId }) => imageId !== id);

const LotImagesContent = ({ lot, auctionId, onError, onDirtyChange }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [images, setImages] = useState<LotImage[]>([]);
  const [deletingImages, setDeletingImages] = useState<LotImage['id'][]>([]);

  useEffect(() => {
    setImages(lot.images);
  }, []);

  const markDirty = () => onDirtyChange(true);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (!files.length) return;

    try {
      setUploading(true);

      const uploaded = await uploadLotImages(auctionId, lot.id, files);

      setImages(addImages(uploaded));
      markDirty();
    } catch (error) {
      onError(error);
    } finally {
      setUploading(false);

      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (image: LotImage) => {
    try {
      setDeletingImages((prev) => [...prev, image.id]);

      await deleteLotImage(auctionId, lot.id, image.id);

      setImages(removeImageById(image.id));
      markDirty();
    } catch (error) {
      onError(error);
    } finally {
      setDeletingImages((prev) => prev.filter((id) => id !== image.id));
    }
  };

  const isImageDeleting = (image: LotImage) => deletingImages.includes(image.id);

  return (
    <>
      <div className="flex flex-wrap gap-3 min-h-[100px]">
        {images.length === 0 && (
          <p className="text-sm text-muted-foreground w-full text-center py-6">No images yet</p>
        )}

        {images.map((image) => (
          <div key={image.id} className="relative group w-20 h-20">
            <img
              src={image.url}
              alt={lot.name}
              className="object-cover rounded-md border w-full h-full"
            />
            <button
              disabled={isImageDeleting(image)}
              onClick={() => handleDelete(image)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button className="w-full" loading={isUploading} onClick={() => inputRef.current?.click()}>
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
    </>
  );
};

export default LotImagesContent;
