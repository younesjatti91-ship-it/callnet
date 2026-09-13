import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DiscrepancyResolutionEnum {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  ACCEPTED_LOSS = 'accepted_loss',
  CARRIER_REFUNDED = 'carrier_refunded',
  RESOLVED = 'resolved',
}

@Entity('payout_discrepancies')
export class PayoutDiscrepancy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column()
  reconciliationRecordId!: string;

  @Index()
  @Column({ nullable: true })
  orderId?: string;

  @Index()
  @Column()
  trackingNumber!: string;

  @Column()
  discrepancyType!: string; // underpayment, overpayment, ghost_shipment, uncollected_returned

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discrepancyAmount!: number;

  @Column({
    type: 'varchar',
    default: DiscrepancyResolutionEnum.OPEN,
  })
  resolutionStatus!: DiscrepancyResolutionEnum;

  @Column({ nullable: true })
  resolutionNotes?: string;

  @Column({ nullable: true })
  resolvedByUserId?: string;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
