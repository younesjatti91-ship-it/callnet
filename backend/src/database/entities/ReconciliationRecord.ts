import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ReconciliationStatusEnum {
  MATCHED = 'matched',
  AMOUNT_MISMATCH = 'amount_mismatch',
  ORDER_NOT_FOUND = 'order_not_found',
  STATUS_MISMATCH = 'status_mismatch', // e.g. remitted as delivered but order was returned
}

@Entity('reconciliation_records')
export class ReconciliationRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  remittanceFileId!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column({ nullable: true })
  orderId?: string;

  @Index()
  @Column()
  trackingNumber!: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  expectedAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  remittedAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  differenceAmount!: number;

  @Column({
    type: 'varchar',
    default: ReconciliationStatusEnum.MATCHED,
  })
  status!: ReconciliationStatusEnum;

  @Column({ nullable: true })
  carrierStatus?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
