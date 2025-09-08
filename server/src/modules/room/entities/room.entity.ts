export class RoomAdmin {
  id: string;
  email: string;
}

export class Room {
  id: string;
  auctionId: string;
  owner: RoomAdmin;
}
