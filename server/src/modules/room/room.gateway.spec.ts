import { RoomGateway } from './room.gateway';
import { RoomRole } from './entities/room.entity';
import { CreateBidDto } from './dto/bid.dto';
import type { TokenService } from '../auth/token.service';
import type { RoomService } from './room.service';
import type { Server, Socket } from 'socket.io';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

const buildGateway = () => {
  const validate = jest.fn();
  const tokenService = {
    roomMemberToken: { validate },
  } as unknown as TokenService;

  const placeBid = jest.fn();
  const placeNextLot = jest.fn();
  const roomService = { placeBid, placeNextLot } as unknown as RoomService;

  const gateway = new RoomGateway(tokenService, roomService);

  return { gateway, validate, placeBid, placeNextLot };
};

const buildServerWithEmit = () => {
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  const server = { to } as unknown as Server;
  return { server, to, emit };
};

describe('RoomGateway', () => {
  describe('afterInit auth middleware', () => {
    const installMiddleware = () => {
      const { gateway, validate } = buildGateway();
      const use = jest.fn<void, [SocketMiddleware]>();
      const server = { use } as unknown as Server;

      gateway.afterInit(server);

      const middleware = use.mock.calls[0][0];

      return { validate, middleware };
    };

    it('rejects the connection when no token is provided', () => {
      const { middleware } = installMiddleware();
      const socket = { handshake: { auth: {} }, data: {} } as unknown as Socket;
      const next = jest.fn();

      middleware(socket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('rejects the connection when the token is invalid', () => {
      const { validate, middleware } = installMiddleware();
      validate.mockReturnValue({ payload: null, reason: 'invalid' });
      const socket = {
        handshake: { auth: { token: 'bad' } },
        data: {},
      } as unknown as Socket;
      const next = jest.fn();

      middleware(socket, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('attaches the user (id from sub) and calls next without error for a valid token', () => {
      const { validate, middleware } = installMiddleware();
      validate.mockReturnValue({
        payload: {
          sub: 'user-1',
          email: 'buyer@example.com',
          name: 'Alice',
          auctionId: 'auction-1',
          role: RoomRole.MEMBER,
        },
      });
      const socket = {
        handshake: { auth: { token: 'good' } },
        data: {},
      } as unknown as Socket;
      const next = jest.fn();

      middleware(socket, next);

      const socketData = socket.data as { user: unknown };
      expect(socketData.user).toEqual({
        id: 'user-1',
        email: 'buyer@example.com',
        name: 'Alice',
        auctionId: 'auction-1',
        role: RoomRole.MEMBER,
      });
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('handleConnection', () => {
    it('joins an admin to both the room channel and the personal channel', async () => {
      const { gateway } = buildGateway();
      const join = jest.fn();
      const client = {
        data: {
          user: { id: 'owner-1', auctionId: 'auction-1', role: RoomRole.ADMIN },
        },
        join,
      } as unknown as Socket;

      await gateway.handleConnection(client);

      expect(join).toHaveBeenCalledWith('room:auction-1');
      expect(join).toHaveBeenCalledWith('room:auction-1:owner-1');
    });

    it('joins a member only to the room channel, not the personal channel', async () => {
      const { gateway } = buildGateway();
      const join = jest.fn();
      const client = {
        data: {
          user: {
            id: 'member-1',
            auctionId: 'auction-1',
            role: RoomRole.MEMBER,
          },
        },
        join,
      } as unknown as Socket;

      await gateway.handleConnection(client);

      expect(join).toHaveBeenCalledTimes(1);
      expect(join).toHaveBeenCalledWith('room:auction-1');
    });
  });

  describe('handleBid', () => {
    const buildMember = () => ({
      id: 'member-1',
      auctionId: 'auction-1',
      email: 'buyer@example.com',
      name: 'Alice',
      role: RoomRole.MEMBER as const,
    });

    it('broadcast payload omits email and keeps id/userId/name/amount', async () => {
      const { gateway, placeBid } = buildGateway();
      placeBid.mockResolvedValue({
        id: 'bid-1',
        userId: 'member-1',
        name: 'Alice',
        amount: 100,
        email: 'buyer@example.com',
      });
      const { server, to, emit } = buildServerWithEmit();
      gateway.server = server;
      const client = { emit: jest.fn() } as unknown as Socket;

      const bid: CreateBidDto = { lotId: 'lot-1', amount: 100 };
      await gateway.handleBid(bid, client, buildMember());

      expect(to).toHaveBeenCalledWith('room:auction-1');
      expect(emit).toHaveBeenCalledWith('newBid', {
        id: 'bid-1',
        userId: 'member-1',
        name: 'Alice',
        amount: 100,
      });
    });

    it('emits an error to the client when the service throws', async () => {
      const { gateway, placeBid } = buildGateway();
      placeBid.mockRejectedValue(new Error('bid too low'));
      const { server } = buildServerWithEmit();
      gateway.server = server;
      const clientEmit = jest.fn();
      const client = { emit: clientEmit } as unknown as Socket;

      const bid: CreateBidDto = { lotId: 'lot-1', amount: 1 };
      await gateway.handleBid(bid, client, buildMember());

      expect(clientEmit).toHaveBeenCalledWith('error', {
        message: 'bid too low',
      });
    });
  });

  describe('handlePlaceLot', () => {
    const buildOwner = () => ({
      id: 'owner-1',
      auctionId: 'auction-1',
      email: 'owner@example.com',
      role: RoomRole.ADMIN as const,
    });

    it('broadcasts newLot with the lot when the auction is not auto-finished', async () => {
      const { gateway, placeNextLot } = buildGateway();
      const lot = { id: 'lot-2' };
      placeNextLot.mockResolvedValue({ autoFinished: false, lot });
      const { server, to, emit } = buildServerWithEmit();
      gateway.server = server;
      const client = { emit: jest.fn() } as unknown as Socket;

      await gateway.handlePlaceLot(client, buildOwner());

      expect(to).toHaveBeenCalledWith('room:auction-1');
      expect(emit).toHaveBeenCalledWith('newLot', lot);
    });

    it('broadcasts auctionFinished when the auction auto-finishes', async () => {
      const { gateway, placeNextLot } = buildGateway();
      placeNextLot.mockResolvedValue({ autoFinished: true });
      const { server, emit } = buildServerWithEmit();
      gateway.server = server;
      const client = { emit: jest.fn() } as unknown as Socket;

      await gateway.handlePlaceLot(client, buildOwner());

      expect(emit).toHaveBeenCalledWith('auctionFinished', {});
    });
  });
});
