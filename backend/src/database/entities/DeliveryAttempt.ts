import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('delivery_attempts')
export class DeliveryAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  shipmentId!: string;

  @Column({ default: 1 })
  attemptNumber!: number;

  @Column()
  outcome!: string; // failed, delivered, rescheduled

  @Column({ nullable: true })
  failureReason?: string; // customer_unreachable, wrong_address, cash_not_ready

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  attemptedAt!: Date;
}
