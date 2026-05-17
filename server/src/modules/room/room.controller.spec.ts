import { Test } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';

describe('RoomController', () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        { provide: RoomService, useValue: {} },
        { provide: RoomGateway, useValue: {} },
      ],
    }).compile();
  });

  describe('getAdminRoomInfo', () => {
    it.todo(
      'auctionId param is extracted and passed to service on getAdminRoomInfo',
    );
  });

  describe('getRoomInfo', () => {
    it.todo(
      'auctionId param is extracted and passed to service on getRoomInfo',
    );
  });

  describe('sendRoomInvite', () => {
    it.todo(
      'auctionId param is extracted and passed to service on sendRoomInvite',
    );
  });

  describe('confirmRoomInvite', () => {
    it.todo(
      'auctionId param is extracted and passed to service on confirmRoomInvite',
    );
  });
});
