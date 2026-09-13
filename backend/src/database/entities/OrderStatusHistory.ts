import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './Order';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  orderId!: string;

  @Column()
  previousStatus!: string;

  @Column()
  newStatus!: string;

  @Column({ nullable: true })
  changedByUserId?: string;

  @Column({ nullable: true })
  changedByName?: string;

  @Column({ nullable: true })
  previousSubstatus?: string;

  @Column({ nullable: true })
  newSubstatus?: string;

  @Column({ default: 0 })
  contactIterations!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Order, (order) => order.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @CreateDateColumn()
  createdAt!: Date;
}
