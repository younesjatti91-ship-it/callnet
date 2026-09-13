import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('customers')
export class Customer {
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
  email?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ default: 0 })
  totalOrders!: number;

  @Column({ default: 0 })
  deliveredOrders!: number;

  @Column({ default: 0 })
  returnedOrders!: number;

  @Column({ default: false })
  isBlacklisted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
