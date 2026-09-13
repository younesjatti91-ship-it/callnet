import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('return_requests')
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  orderId!: string;

  @Index()
  @Column({ nullable: true })
  shipmentId?: string;

  @Column({ default: 'initiated' })
  status!: string; // initiated, in_transit, received, inventory_restocked

  @Column()
  reason!: string; // customer_refused, defective, cancelled_in_transit

  @Column({ nullable: true })
  returnTrackingNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
