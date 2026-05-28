// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuctionStatus } from '@/src/api/dto/auction.dto';

const { mockFetchAuction, mockFetchLots } = vi.hoisted(() => ({
  mockFetchAuction: vi.fn(),
  mockFetchLots: vi.fn(),
}));

vi.mock('@/src/api/auctions-api/requests/auctions', () => ({
  fetchAuctionByIdServer: mockFetchAuction,
}));

vi.mock('@/src/api/auctions-api/requests/lots', () => ({
  fetchLotsServer: mockFetchLots,
}));

vi.mock('@/app/crm/auctions/[auctionId]/LotsList.table', () => ({
  default: () => null,
}));

vi.mock('@/app/crm/auctions/[auctionId]/StartAuction.button', () => ({
  default: () => <button>Start</button>,
}));

vi.mock('@/app/crm/auctions/[auctionId]/ResetAuction.button', () => ({
  default: () => null,
}));

vi.mock('@/app/crm/auctions/[auctionId]/CreateLot.button', () => ({
  default: ({ disabled }: { disabled?: boolean }) => <button disabled={disabled}>Add</button>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

import AuctionPage from './page';

const makeAuction = (status: AuctionStatus, finishedAt: string | null = null) => ({
  id: 'auction-1',
  name: 'Test Auction',
  description: null,
  status,
  createdAt: '2025-01-01T10:00:00Z',
  finishedAt,
});

const params = (auctionId = 'auction-1') => Promise.resolve({ auctionId });

describe('AuctionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchLots.mockResolvedValue([]);
  });

  it('renders status badge for CREATED status', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    render(await AuctionPage({ params: params() }));

    expect(screen.getByText(AuctionStatus.CREATED)).toBeInTheDocument();
  });

  it('renders status badge for STARTED status', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.STARTED));
    render(await AuctionPage({ params: params() }));

    expect(screen.getByText(AuctionStatus.STARTED)).toBeInTheDocument();
  });

  it('renders status badge for FINISHED status', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.FINISHED, '2025-06-01T18:00:00Z'));
    render(await AuctionPage({ params: params() }));

    expect(screen.getByText(AuctionStatus.FINISHED)).toBeInTheDocument();
  });

  it('shows finishedAt date when status is FINISHED', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.FINISHED, '2025-06-01T18:00:00Z'));
    render(await AuctionPage({ params: params() }));

    expect(screen.getByText(/finished at/i)).toBeInTheDocument();
  });

  it('hides finishedAt date when status is CREATED', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    render(await AuctionPage({ params: params() }));

    expect(screen.queryByText(/finished at/i)).not.toBeInTheDocument();
  });

  it('hides finishedAt date when status is STARTED', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.STARTED));
    render(await AuctionPage({ params: params() }));

    expect(screen.queryByText(/finished at/i)).not.toBeInTheDocument();
  });

  it('renders back link with "Auctions" text pointing to /crm/auctions', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    render(await AuctionPage({ params: params() }));

    const link = screen.getByRole('link', { name: /auctions/i });
    expect(link).toHaveAttribute('href', '/crm/auctions');
  });

  it('does not render a Card element wrapping auction info', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    render(await AuctionPage({ params: params() }));

    // shadcn Card uses data-slot="card"; the redesign removed the Card wrapper
    expect(document.querySelector('[data-slot="card"]')).toBeNull();
  });

  it('renders auction name in H1 with status badge in the same row', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    render(await AuctionPage({ params: params() }));

    expect(screen.getByRole('heading', { level: 1, name: 'Test Auction' })).toBeInTheDocument();
    expect(screen.getByText(AuctionStatus.CREATED)).toBeInTheDocument();
  });

  it('renders Lots section header with "Lots" title', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    render(await AuctionPage({ params: params() }));

    expect(screen.getByText('Lots')).toBeInTheDocument();
  });

  it('shows Add button in header when lots exist', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    mockFetchLots.mockResolvedValue([{ id: 'lot-1' }]);
    render(await AuctionPage({ params: params() }));

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('hides Add button in header when lots list is empty', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    mockFetchLots.mockResolvedValue([]);
    render(await AuctionPage({ params: params() }));

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('shows Start button when status is CREATED and lots exist', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    mockFetchLots.mockResolvedValue([{ id: 'lot-1' }]);
    render(await AuctionPage({ params: params() }));

    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
  });

  it('hides Start button when status is CREATED but no lots', async () => {
    mockFetchAuction.mockResolvedValue(makeAuction(AuctionStatus.CREATED));
    mockFetchLots.mockResolvedValue([]);
    render(await AuctionPage({ params: params() }));

    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument();
  });
});
