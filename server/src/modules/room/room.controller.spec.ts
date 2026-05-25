import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { AuthGuard } from '../auth/auth.guard';
import { RoomAuthGuard, RoomAuthOptionalGuard } from './guards/auth.guard';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: Record<string, jest.Mock>;
  let roomGateway: Record<string, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: RoomService,
          useValue: {
            getOwnerRoomInfo: jest.fn(),
            getRoomInfo: jest.fn(),
            sendRoomInvite: jest.fn(),
            confirmRoomInvite: jest.fn(),
          },
        },
        {
          provide: RoomGateway,
          useValue: {
            publishRoomEvent: jest.fn(),
            publishRoomUserEvent: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoomAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoomAuthOptionalGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(RoomController);
    roomService = module.get(RoomService);
    roomGateway = module.get(RoomGateway);

    jest.clearAllMocks();
  });

  describe('getAdminRoomInfo', () => {
    it('auctionId param is extracted and passed to service on getAdminRoomInfo', async () => {
      roomService.getOwnerRoomInfo.mockResolvedValue({
        room: {},
        lots: [],
        activeLot: null,
        activeLotBids: [],
        members: [],
        invites: [],
      });

      await controller.getAdminRoomInfo('auction-1');

      expect(roomService.getOwnerRoomInfo).toHaveBeenCalledWith('auction-1');
    });
  });

  describe('getRoomInfo', () => {
    it('auctionId param is extracted and passed to service on getRoomInfo', async () => {
      roomService.getRoomInfo.mockResolvedValue({
        room: {},
        activeLot: null,
        activeLotBids: [],
        user: null,
      });

      await controller.getRoomInfo('auction-1', null);

      expect(roomService.getRoomInfo).toHaveBeenCalledWith('auction-1', null);
    });
  });

  describe('sendRoomInvite', () => {
    it('auctionId param is extracted and passed to service on sendRoomInvite', async () => {
      const dto = { email: 'buyer@example.com', name: 'Alice' };
      roomService.sendRoomInvite.mockResolvedValue({
        invite: { id: 'inv-1', email: dto.email, name: dto.name },
        room: { auctionId: 'auction-1', ownerId: 'user-1', auction: {} },
      });

      await controller.sendRoomInvite('auction-1', dto as any);

      expect(roomService.sendRoomInvite).toHaveBeenCalledWith('auction-1', dto);
      expect(roomGateway.publishRoomUserEvent).toHaveBeenCalledWith(
        'auction-1',
        'user-1',
        'newInvite',
        expect.any(Object),
      );
    });
  });

  describe('confirmRoomInvite', () => {
    it('auctionId param is extracted and passed to service on confirmRoomInvite', async () => {
      const dto = { token: 'invite-token-abc' };
      roomService.confirmRoomInvite.mockResolvedValue({
        room: { auctionId: 'auction-1', ownerId: 'user-1', auction: {} },
        member: { id: 'm-1', email: 'buyer@example.com', name: 'Alice' },
        token: 'room-token',
      });

      const result = await controller.confirmRoomInvite(
        'auction-1',
        dto as any,
      );

      expect(roomService.confirmRoomInvite).toHaveBeenCalledWith(
        'auction-1',
        dto.token,
      );
      expect(roomGateway.publishRoomUserEvent).toHaveBeenCalledWith(
        'auction-1',
        'user-1',
        'newMember',
        expect.any(Object),
      );
      expect(result).toEqual({ token: 'room-token' });
    });
  });
});
