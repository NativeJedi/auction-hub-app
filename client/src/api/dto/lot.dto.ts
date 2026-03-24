export enum Currency {
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR',
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

export type LotImage = {
  id: string;
  url: string;
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
  images: LotImage[];
};

export type CreateLotDto = Pick<Lot, 'name' | 'description' | 'startPrice' | 'currency'>;

type PresignedUrlDto = {
  presignedUrl: string;
  s3Key: string;
};

export type PresignedUrlsResponseDto = PresignedUrlDto[];

export type AddLotImageDto = {
  s3Key: string;
};

export type AddLotImagesDto = {
  images: AddLotImageDto[];
};
