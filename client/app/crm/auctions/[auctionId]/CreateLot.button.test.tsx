// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/app/crm/auctions/[auctionId]/CreateLot.modal', () => ({
  createLotModal: { show: vi.fn() },
}));

vi.mock('@/app/crm/auctions/[auctionId]/LotImages.modal', () => ({
  lotImagesModal: { show: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/src/modules/notifications/NotifcationContext', () => ({
  useErrorNotification: () => vi.fn(),
}));

import CreateLotButton from './CreateLot.button';

describe('CreateLotButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders as a disabled button when disabled prop is true', () => {
    render(<CreateLotButton auctionId="auction-1" disabled={true} />);

    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
  });

  it('renders as an enabled button when disabled prop is false', () => {
    render(<CreateLotButton auctionId="auction-1" disabled={false} />);

    expect(screen.getByRole('button', { name: /add/i })).not.toBeDisabled();
  });
});
