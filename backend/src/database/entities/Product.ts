import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Column()
  name!: string;

  @Index()
  @Column({ nullable: true })
  sku?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  barredPrice?: number; // Barred / compare-at price (e.g. ~~450 MAD~~)

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costPrice!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  shippingPrice?: number; // Default shipping fee for this product

  @Column({ default: 0 })
  stockQuantity!: number;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  productStoreUrl?: string; // Product store URL on Shopify / YouCan / WooCommerce

  @Column('simple-array', { nullable: true })
  images?: string[]; // Product image gallery URLs

  @Column({ nullable: true })
  imageUrl?: string; // Primary image URL (synced with images[0])

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  isFragile!: boolean; // Fragile handling required for shipping

  @Column({ nullable: true })
  dimensions?: string; // e.g. "25 x 15 x 10 cm"

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weight?: number; // Weight in kg

  @Column({ default: 'MANUAL' })
  source!: string; // SHOPIFY, YOUCAN, WOOCOMMERCE, SHEETS, CSV, MANUAL

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
