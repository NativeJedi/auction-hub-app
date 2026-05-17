import { Test } from '@nestjs/testing';
import { RoomService } from './room.service';
import { AuctionsService } from '../auctions/auctions.service';
import { TokenService } from '../auth/token.service';
import { EmailService } from '../email/email.service';
import { RoomRepository } from './room.repository';
import { BuyersService } from '../buyers/buyers.service';
import { LotsService } from '../lots/lots.service';
import { AppConfigService } from '../../config/app-config.service';

describe('RoomService', () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: AppConfigService, useValue: {} },
        { provide: AuctionsService, useValue: {} },
        { provide: TokenService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: RoomRepository, useValue: {} },
        { provide: BuyersService, useValue: {} },
        { provide: LotsService, useValue: {} },
      ],
    }).compile();
  });

  describe('createRoom', () => {
    it.todo(
      'passes auctionId as room id to repository (room.id === auctionId)',
    );
    it.todo(
      'calls auctionsService.startAuction with auctionId only (no roomId arg)',
    );
    it.todo(
      'throws UnprocessableEntityException when roomRepository.roomExists returns true',
    );
    it.todo('generates token with auctionId field (not roomId)');
  });

  describe('placeNextLot', () => {
    it.todo('returns { lot, autoFinished: false } when a next lot exists');
    it.todo(
      'returns { lot: null, autoFinished: true } when no next lot remains',
    );
    it.todo('calls finishActiveLot before checking for the next lot');
    it.todo(
      'calls completeAuction (bulkMarkUnsold + markAsFinished + clearRoom) on auto-finish',
    );
    it.todo('does NOT call completeAuction when a next lot exists');
  });

  describe('finishAuction', () => {
    it.todo('calls finishActiveLot then bulkMarkUnsold then markAsFinished');
    it.todo('calls clearRoom after marking auction as finished');
    it.todo(
      'skips bulkMarkUnsold and markAsFinished when room does not exist in Redis',
    );
  });

  describe('completeAuction', () => {
    it.todo('calls bulkMarkUnsold with the auction id from the room');
    it.todo('calls markAsFinished with the auction id from the room');
    it.todo('calls clearRoom regardless of whether room is found in Redis');
    it.todo('does not call bulkMarkUnsold or markAsFinished when room is null');
  });

  describe('resetAuction', () => {
    it.todo('calls auctionsService.resetAuction with ownerId and auctionId');
    it.todo('calls roomRepository.clearRoom with currentRoomId when it is set');
    it.todo('does NOT call clearRoom when currentRoomId is null');
  });

  describe('RoomRepository.roomExists', () => {
    it.todo('returns true when Redis key exists for auctionId');
    it.todo('returns false when Redis key is absent for auctionId');
  });
});
