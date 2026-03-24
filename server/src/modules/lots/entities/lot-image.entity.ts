import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lot } from './lots.entity';

@Entity()
export class LotImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  s3Key: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Lot, (lot) => lot.images, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  lot: Lot;
}
