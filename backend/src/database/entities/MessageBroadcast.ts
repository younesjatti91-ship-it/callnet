import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BroadcastStatusEnum {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('message_broadcasts')
export class MessageBroadcast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  templateBody!: string;

  @Column({
    type: 'varchar',
    default: BroadcastStatusEnum.DRAFT,
  })
  status!: BroadcastStatusEnum;

  @Column({ default: 0 })
  totalRecipients!: number;

  @Column({ default: 0 })
  sentCount!: number;

  @Column({ default: 0 })
  deliveredCount!: number;

  @Column({ default: 0 })
  failedCount!: number;

  @Column({ default: 2000 })
  throttleMs!: number; // Delay between messages in ms to prevent WhatsApp bans

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
