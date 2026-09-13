import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Seller } from './Seller';
import { UserStoreAssignment } from './UserStoreAssignment';
import { StoreIntegrationAccount } from './StoreIntegrationAccount';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ default: 'USD' })
  currency!: string;

  @Column({ default: 'en' })
  locale!: string;

  @Column({ default: 'UTC' })
  timezone!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column('simple-json', { nullable: true })
  settings?: Record<string, any>;

  @Index()
  @Column()
  sellerId!: string;

  @ManyToOne(() => Seller, (seller) => seller.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller!: Seller;

  @OneToMany(() => UserStoreAssignment, (assignment) => assignment.store)
  userAssignments!: UserStoreAssignment[];

  @OneToMany(() => StoreIntegrationAccount, (integration) => integration.store)
  integrations!: StoreIntegrationAccount[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
