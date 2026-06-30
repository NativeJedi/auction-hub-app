import { makeSARequest } from '@/src/api/makeSARequest';
import {
  addLotImagesAction,
  deleteLotImageAction,
  presignLotImagesAction,
} from '@/src/api/actions/lots.actions';
import { Auction } from '@/src/api/dto/auction.dto';
import { Lot, LotImage } from '@/src/api/dto/lot.dto';

export const deleteLotImage = makeSARequest(deleteLotImageAction);

const presignLotImages = makeSARequest(presignLotImagesAction);
const addLotImages = makeSARequest(addLotImagesAction);

export const uploadLotImages = async (
  auctionId: Auction['id'],
  lotId: Lot['id'],
  files: File[]
): Promise<LotImage[]> => {
  const presignResults = await presignLotImages(auctionId, lotId, files.length);

  await Promise.all(
    presignResults.map(({ presignedUrl }, i) =>
      fetch(presignedUrl, {
        method: 'PUT',
        body: files[i],
        headers: { 'Content-Type': files[i].type || 'image/jpeg' },
      }).then((res) => {
        if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      })
    )
  );

  return addLotImages(auctionId, lotId, {
    images: presignResults.map(({ s3Key }) => ({ s3Key })),
  });
};
