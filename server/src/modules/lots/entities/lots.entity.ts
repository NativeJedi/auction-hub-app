import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Auction } from '../../auctions/entities/auction.entity';
import { Currency } from '../../../types/currency';
import { Buyer } from '../../buyers/entities/buyer.entity';

export enum LotStatus {
  CREATED = 'created',
  SOLD = 'sold',
  UNSOLD = 'unsold',
}

@Entity()
export class Lot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  startPrice: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'enum', enum: LotStatus, default: LotStatus.CREATED })
  status: LotStatus;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', nullable: true })
  soldPrice?: number;

  @ManyToOne(() => Auction, (auction) => auction.lots, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  auction: Auction;

  @OneToOne(() => Buyer, (buyer) => buyer.lot, { cascade: true })
  @JoinColumn()
  buyer: Buyer;
}
