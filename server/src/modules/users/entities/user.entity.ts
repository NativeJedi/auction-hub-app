import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Auction } from '../../auctions/entities/auction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255, select: false })
  password: string;

  @OneToMany(() => Auction, (auction) => auction.owner)
  auctions?: Auction[];
}
