// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Currency, LotStatus, type Lot, type LotImage } from '@/src/api/dto/lot.dto';

const { mockUploadLotImages, mockDeleteLotImage } = vi.hoisted(() => ({
  mockUploadLotImages: vi.fn(),
  mockDeleteLotImage: vi.fn(),
}));

vi.mock('@/app/crm/auctions/[auctionId]/components/LotImages/actions', () => ({
  uploadLotImages: mockUploadLotImages,
  deleteLotImage: mockDeleteLotImage,
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Trash2: () => <span aria-label="delete image" />,
    Upload: () => null,
  };
});

import LotImagesContent from './LotImagesContent';

const makeImage = (id: string): LotImage => ({ id, url: `https://example.com/${id}.jpg` });

const makeLot = (images: LotImage[] = []): Lot => ({
  id: 'lot-1',
  name: 'Watch',
  startPrice: 100,
  currency: Currency.UAH,
  status: LotStatus.CREATED,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  images,
});

describe('LotImagesContent', () => {
  const onError = vi.fn();
  const onDirtyChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing lot images', () => {
    const lot = makeLot([makeImage('img-1'), makeImage('img-2')]);
    render(
      <LotImagesContent
        lot={lot}
        auctionId="auction-1"
        onError={onError}
        onDirtyChange={onDirtyChange}
      />
    );

    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/img-1.jpg');
  });

  it('shows empty state when lot has no images', () => {
    render(
      <LotImagesContent
        lot={makeLot()}
        auctionId="auction-1"
        onError={onError}
        onDirtyChange={onDirtyChange}
      />
    );

    expect(screen.getByText(/no images yet/i)).toBeInTheDocument();
  });

  it('calls onDirtyChange(true) after successful upload', async () => {
    const user = userEvent.setup();
    mockUploadLotImages.mockResolvedValue([makeImage('new-img')]);

    const { container } = render(
      <LotImagesContent
        lot={makeLot()}
        auctionId="auction-1"
        onError={onError}
        onDirtyChange={onDirtyChange}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockUploadLotImages).toHaveBeenCalledWith('auction-1', 'lot-1', [file]);
      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });
  });

  it('calls onDirtyChange(true) after successful delete', async () => {
    const user = userEvent.setup();
    mockDeleteLotImage.mockResolvedValue(undefined);
    const image = makeImage('img-1');

    render(
      <LotImagesContent
        lot={makeLot([image])}
        auctionId="auction-1"
        onError={onError}
        onDirtyChange={onDirtyChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete image/i }));

    await waitFor(() => {
      expect(mockDeleteLotImage).toHaveBeenCalledWith('auction-1', 'lot-1', 'img-1');
      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });
  });

  it('calls onError when upload fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Upload failed');
    mockUploadLotImages.mockRejectedValue(error);

    const { container } = render(
      <LotImagesContent
        lot={makeLot()}
        auctionId="auction-1"
        onError={onError}
        onDirtyChange={onDirtyChange}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
    expect(onDirtyChange).not.toHaveBeenCalled();
  });

  it('calls onError when delete fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Delete failed');
    mockDeleteLotImage.mockRejectedValue(error);
    const image = makeImage('img-1');

    render(
      <LotImagesContent
        lot={makeLot([image])}
        auctionId="auction-1"
        onError={onError}
        onDirtyChange={onDirtyChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete image/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
    expect(onDirtyChange).not.toHaveBeenCalled();
  });
});
