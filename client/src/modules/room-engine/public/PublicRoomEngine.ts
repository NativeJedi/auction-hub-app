import type BaseSocket from '@/src/sockets/base-socket';
import type { PublicBidInfo, RoomInfoResponseDto, RoomLot, SendInviteDto } from '@/src/api/dto/room.dto';
import { fetchRoomInfo, sendRoomInvite } from '@/src/api/auctions-api-client/requests/room';
import { RoomEngine } from '../core/RoomEngine';
import type { PublicRoomData } from './types';

export interface PublicRoomApi {
  fetchRoomInfo: (params: { roomId: string }) => Promise<RoomInfoResponseDto>;
  sendRoomInvite: typeof sendRoomInvite;
}

const defaultApi: PublicRoomApi = { fetchRoomInfo, sendRoomInvite };

export class PublicRoomEngine extends RoomEngine<PublicRoomData> {
  constructor(
    roomId: string,
    socket: BaseSocket,
    private readonly api: PublicRoomApi = defaultApi,
  ) {
    super(roomId, socket);
  }

  protected getInitialData(): PublicRoomData {
    return {
      auction: null,
      activeLot: null,
      bids: [],
    };
  }

  protected async fetchInitialData(): Promise<Partial<PublicRoomData>> {
    const { room, activeLot, activeLotBids } = await this.api.fetchRoomInfo({
      roomId: this.roomId,
    });
    return {
      auction: room.auction,
      activeLot: activeLot ?? null,
      bids: activeLotBids,
    };
  }

  async sendInvite(dto: SendInviteDto): Promise<void> {
    await this.api.sendRoomInvite(this.roomId, dto);
  }

  private onFinishedCallback?: () => void;

  onAuctionFinished(callback: () => void): void {
    this.onFinishedCallback = callback;
  }

  protected registerSocketEvents(): void {
    super.registerSocketEvents();

    this.socket.onEvent('auctionFinished', () => {
      this.onFinishedCallback?.();
    });

    this.socket.onEvent<PublicBidInfo>('newBid', (bid) => {
      this.setState({ bids: [bid, ...this.data.bids] });
    });

    this.socket.onEvent<RoomLot>('newLot', (lot) => {
      this.setState({ activeLot: lot, bids: [] });
    });
  }
}
