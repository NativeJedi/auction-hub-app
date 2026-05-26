import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Auction } from '../../auctions/entities/auction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  googleId: string | null;

  @OneToMany(() => Auction, (auction) => auction.owner)
  auctions?: Auction[];
}
