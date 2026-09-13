import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './Order';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  orderId!: string;

  @Column({ nullable: true })
  productId?: string;

  @Column()
  productName!: string;

  @Column({ nullable: true })
  sku?: string;

  @Column({ default: 1 })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  unitPrice!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPrice!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;
}
