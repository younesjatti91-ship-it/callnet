import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Store } from './Store';

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyName!: string;

  @Column({ nullable: true })
  taxNumber?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ default: 'active' })
  status!: string; // active, suspended, pending

  @Column()
  ownerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerUserId' })
  ownerUser!: User;

  @OneToMany(() => Store, (store) => store.seller)
  stores!: Store[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
