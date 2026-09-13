import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_contacts')
export class WhatsAppContact {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column()
  chatId!: string; // e.g. 212600112233@c.us or 12345@lid

  @Index()
  @Column()
  phone!: string; // Normalized E.164 phone number e.g. +212600112233

  @Column({ default: 'WhatsApp Contact' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  lastMessage?: string;

  @Column({ nullable: true })
  lastMessageTimestamp?: Date;

  @Column({ default: 0 })
  unreadCount!: number;

  @Column({ default: false })
  hasOrdered!: boolean;

  @Column({ default: 'whatsapp_conversation' })
  source!: string;

  @Column('simple-array', { nullable: true })
  tags?: string[]; // e.g. ['inquired', 'potential_lead']

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
