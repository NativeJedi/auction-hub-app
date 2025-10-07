export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  UAH = 'UAH',
}

export enum LotStatus {
  CREATED = 'created',
  SOLD = 'sold',
  UNSOLD = 'unsold',
}

export type LotBuyer = {
  id: string;
  name: string;
  email: string;
};

export type Lot = {
  id: string;
  name: string;
  description?: string;
  startPrice: number;
  soldPrice?: number;
  currency: Currency;
  status: LotStatus;
  createdAt: string;
  updatedAt: string;
  buyer?: LotBuyer;
};

export type CreateLotDto = Pick<Lot, 'name' | 'description' | 'startPrice' | 'currency'>;
