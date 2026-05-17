import type BaseSocket from '@/src/sockets/base-socket';
import type { Room, RoomBid, RoomInvite, RoomLot, RoomMember } from '@/src/api/dto/room.dto';
import {
  startAuction,
  fetchAdminRoomInfo,
  finishAuction,
  restartAuction,
} from '@/src/api/auctions-api-client/requests/room';
import { setRoomToken } from '@/src/utils/local-storage';
import { AdminRoomData } from './types';
import { RoomEngine } from '../core/RoomEngine';

export interface AdminRoomApi {
  fetchAdminRoomInfo: typeof fetchAdminRoomInfo;
  finishAuction: typeof finishAuction;
  restartAuction: typeof restartAuction;
}

const defaultApi: AdminRoomApi = { fetchAdminRoomInfo, finishAuction, restartAuction };

export class AdminRoomEngine extends RoomEngine<AdminRoomData> {
  constructor(
    auctionId: string,
    socket: BaseSocket,
    private readonly api: AdminRoomApi = defaultApi
  ) {
    super(auctionId, socket);
  }

  protected getInitialData(): AdminRoomData {
    return {
      auction: null,
      activeLot: null,
      lots: [],
      bids: [],
      members: [],
      invites: [],
    };
  }

  protected async fetchInitialData(): Promise<Partial<AdminRoomData>> {
    const data = await this.api.fetchAdminRoomInfo({ auctionId: this.auctionId });

    return {
      auction: data.room.auction,
      activeLot: data.activeLot,
      lots: data.lots,
      bids: data.activeLotBids,
      members: data.members,
      invites: data.invites,
    };
  }

  get isLastLot() {
    const { lots, activeLot } = this.data;
    if (!lots.length || !activeLot) return true;

    return lots[lots.length - 1].id === activeLot.id;
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

    this.socket.onEvent<RoomBid>('newBid', (bid) => {
      this.setState({ bids: [bid, ...this.data.bids] });
    });

    this.socket.onEvent<RoomLot>('newLot', (lot) => {
      this.setState({ activeLot: lot, bids: [] });
    });

    this.socket.onEvent<RoomMember>('memberJoined', (member) => {
      this.setState({ members: [...this.data.members, member] });
    });

    this.socket.onEvent<RoomInvite>('newInvite', (invite) => {
      this.setState({ invites: [...this.data.invites, invite] });
    });

    this.socket.onEvent<RoomMember>('newMember', (member) => {
      this.setState({
        members: [...this.data.members, member],
        invites: this.data.invites.filter((inv) => inv.id !== member.id),
      });
    });
  }

  // Static factory — called before a room engine instance exists
  static async startAuction(auctionId: string): Promise<Room> {
    const { room, token } = await startAuction({ auctionId });
    setRoomToken(room.auctionId, token);
    return room;
  }

  // Admin actions

  async finishAuction(): Promise<void> {
    await this.api.finishAuction({ auctionId: this.auctionId });
  }

  async resetAuction(): Promise<void> {
    await this.api.restartAuction({ auctionId: this.auctionId });
  }

  nextLot(): void {
    this.socket.emitEvent('placeLot');
  }
}
