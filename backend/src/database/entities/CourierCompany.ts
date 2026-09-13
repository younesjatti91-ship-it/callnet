import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('courier_companies')
export class CourierCompany {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // jt_express, dhl, ninjavan, fedex, pos_indonesia

  @Column()
  name!: string;

  @Column({ nullable: true })
  trackingUrlTemplate?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'simple-json', nullable: true })
  servicedCities?: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
