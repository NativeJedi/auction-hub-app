import type BaseSocket from '@/src/sockets/base-socket';
import type {
  ConfirmRoomInviteResponseDto,
  PublicBidInfo,
  RoomInfoResponseDto,
  RoomLot,
} from '@/src/api/dto/room.dto';
import { confirmRoomInvite, fetchRoomInfo } from '@/src/api/auctions-api-client/requests/room';
import { setRoomToken } from '@/src/utils/local-storage';
import { RoomEngine } from '../core/RoomEngine';
import { MemberRoomData } from './types';

export interface MemberRoomApi {
  fetchRoomInfo: (params: { roomId: string }) => Promise<RoomInfoResponseDto>;
  confirmRoomInvite: (
    roomId: string,
    dto: { token: string }
  ) => Promise<ConfirmRoomInviteResponseDto>;
}

const defaultApi: MemberRoomApi = { fetchRoomInfo, confirmRoomInvite };

export class MemberRoomEngine extends RoomEngine<MemberRoomData> {
  constructor(
    roomId: string,
    socket: BaseSocket,
    private readonly api: MemberRoomApi = defaultApi
  ) {
    super(roomId, socket);
  }

  protected getInitialData(): MemberRoomData {
    return {
      auction: null,
      activeLot: null,
      bids: [],
      user: null,
      bidIncrement: 0,
    };
  }

  // Computed getters — derived from data, no storage overhead

  get leadingBid(): PublicBidInfo | undefined {
    return this.data.bids[0];
  }

  get isWinning(): boolean {
    console.log(this.data.user, this.leadingBid);
    return (
      this.data.user != null &&
      this.leadingBid != null &&
      this.data.user.id === this.leadingBid.userId
    );
  }

  get lotCurrency() {
    return this.data.activeLot?.currency;
  }

  get leadingAmount(): number {
    if (!this.leadingBid) {
      return this.data.activeLot?.startPrice ?? 0;
    }

    return this.leadingBid.amount;
  }

  get isSubmitBidDisabled(): boolean {
    if (this.getState().isLoading) {
      return true;
    }

    if (!this.leadingBid) {
      return false;
    }

    return this.data.bidIncrement <= 0;
  }

  protected async fetchInitialData(): Promise<Partial<MemberRoomData>> {
    const { room, activeLot, activeLotBids, user } = await this.api.fetchRoomInfo({
      roomId: this.roomId,
    });

    return {
      auction: room.auction,
      activeLot: activeLot ?? null,
      bids: activeLotBids,
      user: user ?? null,
      bidIncrement: 0,
    };
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
      this.setState({
        bids: [bid, ...this.data.bids],
        bidIncrement: 0,
      });
    });

    // Reset bidAmount to new lot's startPrice when the lot changes
    this.socket.onEvent<RoomLot>('newLot', (lot) => {
      this.setState({
        activeLot: lot,
        bids: [],
        bidIncrement: 0,
      });
    });
  }

  // Actions

  async confirmInvite(inviteToken: string): Promise<void> {
    const { token } = await this.api.confirmRoomInvite(this.roomId, { token: inviteToken });
    setRoomToken(this.roomId, token);
  }

  changeBidAmount(totalAmount: number) {
    const increment = totalAmount - this.leadingAmount;

    if (increment <= 0) return;

    this.setState({ bidIncrement: increment });
  }

  increaseBidAmount(step: number): void {
    this.setState({ bidIncrement: this.data.bidIncrement + step });
  }

  placeBid(): void {
    this.socket.emitEvent('placeBid', {
      amount: this.data.bidIncrement,
      lotId: this.data.activeLot?.id,
    });
  }
}
