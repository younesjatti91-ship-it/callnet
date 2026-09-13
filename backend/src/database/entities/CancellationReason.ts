import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cancellation_reasons')
export class CancellationReason {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // customer_refused, wrong_address, fake_lead, duplicate, out_of_stock, customer_unreachable

  @Column()
  label!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
