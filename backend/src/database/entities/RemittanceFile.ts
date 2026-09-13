import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum RemittanceFileStatusEnum {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('remittance_files')
export class RemittanceFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Column({ nullable: true })
  courierAccountId?: string;

  @Column()
  fileName!: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({
    type: 'varchar',
    default: RemittanceFileStatusEnum.UPLOADED,
  })
  status!: RemittanceFileStatusEnum;

  @Column({ default: 0 })
  totalRows!: number;

  @Column({ default: 0 })
  matchedRows!: number;

  @Column({ default: 0 })
  discrepancyRows!: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalRemittedAmount!: number;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
