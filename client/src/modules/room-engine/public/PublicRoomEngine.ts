import type BaseSocket from '@/src/sockets/base-socket';
import type {
  PublicBidInfo,
  RoomInfoResponseDto,
  RoomLot,
  SendInviteDto,
} from '@/src/api/dto/room.dto';
import { fetchRoomInfo } from '@/src/api/requests/room.client';
import { RoomEngine } from '../core/RoomEngine';
import { sortBidsByAmountDesc } from '../core/sortBids';
import type { PublicRoomData } from './types';
import { makeSARequest } from '@/src/api/makeSARequest';
import { sendRoomInviteAction } from '@/src/api/actions/room.actions';

export const sendRoomInvite = makeSARequest(sendRoomInviteAction);

export interface PublicRoomApi {
  fetchRoomInfo: (params: { auctionId: string }) => Promise<RoomInfoResponseDto>;
  sendRoomInvite: typeof sendRoomInvite;
}

const defaultApi: PublicRoomApi = { fetchRoomInfo, sendRoomInvite };

export class PublicRoomEngine extends RoomEngine<PublicRoomData> {
  constructor(
    auctionId: string,
    socket: BaseSocket,
    private readonly api: PublicRoomApi = defaultApi
  ) {
    super(auctionId, socket);
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
      auctionId: this.auctionId,
    });
    return {
      auction: room.auction,
      activeLot: activeLot ?? null,
      bids: activeLotBids,
    };
  }

  async sendInvite(dto: SendInviteDto): Promise<void> {
    await this.api.sendRoomInvite(this.auctionId, dto);
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
      if (this.data.bids.some((b) => b.id === bid.id)) return;
      this.setState({ bids: sortBidsByAmountDesc([bid, ...this.data.bids]) });
    });

    this.socket.onEvent<RoomLot>('newLot', (lot) => {
      this.setState({ activeLot: lot, bids: [] });
    });
  }
}
