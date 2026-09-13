import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('store_integration_providers')
export class StoreIntegrationProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string; // shopify, woocommerce, youcan

  @Column()
  name!: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column('simple-json', { nullable: true })
  supportedFeatures?: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
