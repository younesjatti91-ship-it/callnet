import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CallOutcomeEnum {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  UNREACHABLE = 'unreachable',
  WRONG_NUMBER = 'wrong_number',
  RESCHEDULED = 'rescheduled',
}

@Entity('call_logs')
export class CallLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column()
  orderId!: string;

  @Index()
  @Column()
  agentUserId!: string;

  @Column()
  agentName!: string;

  @Column()
  customerPhone!: string;

  @Column({
    type: 'varchar',
    default: CallOutcomeEnum.NO_ANSWER,
  })
  outcome!: CallOutcomeEnum;

  @Column({ default: 0 })
  durationSeconds!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  callbackScheduledAt?: Date;

  @Column({ default: false })
  whatsappTriggered!: boolean;

  @CreateDateColumn()
  calledAt!: Date;
}
