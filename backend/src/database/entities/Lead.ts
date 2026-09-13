import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Column()
  fullName!: string;

  @Index()
  @Column()
  phone!: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  productId?: string;

  @Column({ default: 'new' })
  status!: string; // new, verified, fake_rejected, converted

  @Column({ nullable: true })
  source?: string; // webhook, csv_upload, manual_entry

  @Column('simple-json', { nullable: true })
  rawPayload?: Record<string, any>;

  @Column({ nullable: true })
  fraudScore?: number; // 0-100 fraud probability

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
