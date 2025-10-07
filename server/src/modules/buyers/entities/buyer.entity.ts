import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Lot } from '../../lots/entities/lots.entity';

@Entity()
export class Buyer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ length: 255 })
  email: string;

  @OneToOne(() => Lot, (lot) => lot.buyer, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  lot: Lot;
}
