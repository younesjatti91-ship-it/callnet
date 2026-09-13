import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './Store';
import { OrderItem } from './OrderItem';
import { OrderStatusHistory } from './OrderStatusHistory';
import { Shipment } from './Shipment';

export type OrderStatusCode =
  | 'NEW'
  | 'CONFIRMATION'
  | 'FULFILLMENT'
  | 'DELIVERY'
  | 'RETURN'
  | 'CANCELLED';

export type OrderSubstatusCode =
  | 'PENDING_REVIEW'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'PREPARING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPTED'
  | 'DELAYED'
  | 'REFUSED'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURN_IN_PROGRESS'
  | 'RETURNED'
  | 'RETURN_RECEIVED'
  | 'CUSTOMER_CANCELLED'
  | 'PRODUCT_UNAVAILABLE'
  | 'INVALID_PHONE'
  | 'FAKE_ORDER'
  | 'DUPLICATE_ORDER'
  | 'CUSTOMER_DID_NOT_ORDER'
  | 'WRONG_ADDRESS'
  | 'OTHER'
  | string;

export enum OrderStatusEnum {
  PENDING_VERIFICATION = 'pending_verification',
  CONFIRMED = 'confirmed',
  RESCHEDULED = 'rescheduled',
  FULFILLMENT = 'fulfillment',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum RemittanceStatusEnum {
  UNRECONCILED = 'unreconciled',
  RECONCILED = 'reconciled',
  DISCREPANCY = 'discrepancy',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column()
  orderNumber!: string;

  @Index()
  @Column({
    type: 'varchar',
    default: OrderStatusEnum.PENDING_VERIFICATION,
  })
  status!: OrderStatusEnum;

  @Index()
  @Column({
    type: 'varchar',
    default: 'NEW',
  })
  statusCode!: string;

  @Index()
  @Column({
    type: 'varchar',
    default: 'PENDING_REVIEW',
  })
  substatus!: string;

  @Column({ default: 0 })
  contactIterations!: number;

  @Column({ type: 'text', nullable: true })
  lastComment?: string;

  @Column({ nullable: true })
  courierCompanyId?: string;

  @Column({ nullable: true })
  courierAccountId?: string;

  @Column({ nullable: true })
  customerId?: string;

  @Column()
  customerName!: string;

  @Index()
  @Column()
  customerPhone!: string;

  @Column({ nullable: true })
  customerEmail?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingFee!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  codAmount!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @Index()
  @Column({ nullable: true })
  assignedAgentId?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  agentCommissionAmount!: number;

  @Column({ default: 0 })
  callAttemptsCount!: number;

  @Column({ nullable: true })
  lastCallAttemptAt?: Date;

  @Column({ nullable: true })
  scheduledCallbackAt?: Date;

  @Column({ default: 'manual' })
  source!: string; // shopify, woocommerce, youcan, csv_import, manual

  @Column({ nullable: true })
  externalOrderId?: string;

  @Index()
  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  courierName?: string;

  @Column({
    type: 'varchar',
    default: RemittanceStatusEnum.UNRECONCILED,
  })
  remittanceStatus!: RemittanceStatusEnum;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  cancellationReason?: string;

  @OneToMany(() => OrderItem, (item: OrderItem) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history: OrderStatusHistory) => history.order)
  statusHistory!: OrderStatusHistory[];

  @OneToMany(() => Shipment, (shipment: Shipment) => shipment.order)
  shipments!: Shipment[];

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store!: Store;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
