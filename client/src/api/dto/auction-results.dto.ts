export type LotResult = {
  id: string;
  name: string;
  status: 'sold' | 'unsold' | 'created';
  soldPrice: number | null;
  buyerName: string | null;
};

export type AuctionResults = {
  id: string;
  name: string;
  description: string | null;
  finishedAt: string | null;
  totalLots: number;
  soldCount: number;
  unsoldCount: number;
  valuesByCurrency: Record<string, number>;
  lots: LotResult[];
};
