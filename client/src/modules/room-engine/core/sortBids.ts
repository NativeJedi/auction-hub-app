// Keeps a bid collection ordered by amount (highest first), matching the
// server's sorted-set storage. Used when inserting a live `newBid` so the
// client list stays consistent regardless of arrival order.
export const sortBidsByAmountDesc = <T extends { amount: number }>(bids: T[]): T[] =>
  [...bids].sort((a, b) => b.amount - a.amount);
