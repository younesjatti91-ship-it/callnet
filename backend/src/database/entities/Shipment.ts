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
import { Order } from './Order';
import { CourierAccount } from './CourierAccount';
import { ShipmentTrackingSnapshot } from './ShipmentTrackingSnapshot';

export enum ShipmentStatusEnum {
  CREATED = 'created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_ATTEMPT = 'failed_attempt',
  RETURNED = 'returned',
  EXCEPTION = 'exception',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  orderId!: string;

  @Index()
  @Column()
  courierAccountId!: string;

  @Index({ unique: true })
  @Column()
  trackingNumber!: string;

  @Column({
    type: 'varchar',
    default: ShipmentStatusEnum.CREATED,
  })
  status!: ShipmentStatusEnum;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  codAmountToCollect!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingCost!: number;

  @Column({ nullable: true })
  recipientName?: string;

  @Column({ nullable: true })
  recipientPhone?: string;

  @Column({ type: 'text', nullable: true })
  destinationAddress?: string;

  @Column({ nullable: true })
  deliveredAt?: Date;

  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @ManyToOne(() => CourierAccount)
  @JoinColumn({ name: 'courierAccountId' })
  courierAccount!: CourierAccount;

  @OneToMany(() => ShipmentTrackingSnapshot, (snapshot: ShipmentTrackingSnapshot) => snapshot.shipment)
  snapshots!: ShipmentTrackingSnapshot[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
