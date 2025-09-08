import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lot } from '../../lots/entities/lots.entity';

export enum AuctionStatus {
  CREATED = 'created',
  STARTED = 'started',
  FINISHED = 'finished',
}

@Entity()
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: AuctionStatus, default: AuctionStatus.CREATED })
  status: AuctionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auctions, { nullable: false })
  owner: User;

  @OneToMany(() => Lot, (lot) => lot.auction, { cascade: true })
  lots: Lot[];
}
