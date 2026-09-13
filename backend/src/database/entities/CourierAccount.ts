import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from './Store';
import { CourierCompany } from './CourierCompany';

@Entity('courier_accounts')
export class CourierAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Index()
  @Column()
  courierCompanyId!: string;

  @Column()
  accountName!: string;

  @Column({ nullable: true })
  accountNumber?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store!: Store;

  @ManyToOne(() => CourierCompany)
  @JoinColumn({ name: 'courierCompanyId' })
  courierCompany!: CourierCompany;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
