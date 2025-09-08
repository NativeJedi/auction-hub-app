import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Auction } from '../../auctions/entities/auction.entity';
import { Currency } from '../../../types/currency';

export enum LotStatus {
  CREATED = 'created',
  PUBLISHED = 'published',
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
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'enum', enum: LotStatus, default: LotStatus.CREATED })
  status: LotStatus;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishDate?: Date;

  @ManyToOne(() => Auction, (auction) => auction.lots, { nullable: false })
  auction: User;
}
