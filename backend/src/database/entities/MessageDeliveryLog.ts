import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MessageDeliveryStatusEnum {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('message_delivery_logs')
export class MessageDeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column({ nullable: true })
  broadcastId?: string;

  @Index()
  @Column({ nullable: true })
  orderId?: string;

  @Index()
  @Column()
  recipientPhone!: string;

  @Column({ type: 'text' })
  messageContent!: string;

  @Column({
    type: 'varchar',
    default: MessageDeliveryStatusEnum.QUEUED,
  })
  status!: MessageDeliveryStatusEnum;

  @Column({ nullable: true })
  externalMessageId?: string; // WAHA message ID

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
