import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './Store';
import { StoreIntegrationProvider } from './StoreIntegrationProvider';

@Entity('store_integration_accounts')
export class StoreIntegrationAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column()
  providerId!: string;

  @Column()
  accountName!: string;

  @Column({ nullable: true })
  externalShopDomain?: string; // e.g. mystore.myshopify.com

  @Column({ default: 'connected' })
  status!: string; // connected, disconnected, error

  @Column({ default: true })
  syncOrdersEnabled!: boolean;

  @Column({ nullable: true })
  lastSyncedAt?: Date;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store!: Store;

  @ManyToOne(() => StoreIntegrationProvider)
  @JoinColumn({ name: 'providerId' })
  provider!: StoreIntegrationProvider;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
