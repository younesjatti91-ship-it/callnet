import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('internal_messages')
export class InternalMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  senderId!: string;

  @Index()
  @Column()
  receiverId!: string;

  @Column('text')
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ nullable: true })
  readAt?: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiverId' })
  receiver!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
