import type BaseSocket from '@/src/sockets/base-socket';
import type {
  ConfirmRoomInviteResponseDto,
  PublicBidInfo,
  RoomInfoResponseDto,
  RoomLot,
} from '@/src/api/dto/room.dto';
import { confirmRoomInvite, fetchRoomInfo } from '@/src/api/auctions-api-client/requests/room';
import { RoomEngine } from '../core/RoomEngine';
import { sortBidsByAmountDesc } from '../core/sortBids';
import { MemberRoomData } from './types';

export interface MemberRoomApi {
  fetchRoomInfo: (params: { auctionId: string }) => Promise<RoomInfoResponseDto>;
  confirmRoomInvite: (
    auctionId: string,
    dto: { token: string }
  ) => Promise<ConfirmRoomInviteResponseDto>;
}

const defaultApi: MemberRoomApi = { fetchRoomInfo, confirmRoomInvite };

export class MemberRoomEngine extends RoomEngine<MemberRoomData> {
  constructor(
    auctionId: string,
    socket: BaseSocket,
    private readonly api: MemberRoomApi = defaultApi
  ) {
    super(auctionId, socket);
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
      auctionId: this.auctionId,
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
      if (this.data.bids.some((b) => b.id === bid.id)) return;
      this.setState({
        bids: sortBidsByAmountDesc([bid, ...this.data.bids]),
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
    const { token } = await this.api.confirmRoomInvite(this.auctionId, { token: inviteToken });
    RoomEngine.setRoomToken(this.auctionId, token);
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
    // Send the absolute price the bidder committed to (current leading + their
    // chosen increment). The server stores it as-is, so a shifting baseline can
    // never inflate the bidder's commitment.
    this.socket.emitEvent('placeBid', {
      amount: this.leadingAmount + this.data.bidIncrement,
      lotId: this.data.activeLot?.id,
    });
  }
}
