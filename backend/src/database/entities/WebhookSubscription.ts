import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Column()
  providerCode!: string; // shopify, woocommerce, youcan

  @Column()
  topic!: string; // orders/create, orders/updated, checkout/created

  @Column({ unique: true })
  webhookSecret!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  totalEventsReceived!: number;

  @Column({ nullable: true })
  lastEventAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
