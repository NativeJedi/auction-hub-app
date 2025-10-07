export type PaginatedResponseDto<T> = {
  items: T[];

  total: number;

  page: number;

  limit: number;

  totalPages: number;
};
