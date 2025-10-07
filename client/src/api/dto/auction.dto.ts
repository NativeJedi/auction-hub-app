export enum AuctionStatus {
  CREATED = 'created',
  STARTED = 'started',
  FINISHED = 'finished',
}

export type Auction = {
  id: string;
  name: string;
  description?: string;
  status: AuctionStatus;
  createdAt: string;
};

export type CreateAuctionDto = Pick<Auction, 'name' | 'description'>;
