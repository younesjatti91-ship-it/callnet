import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Shipment } from './Shipment';

@Entity('shipment_tracking_snapshots')
export class ShipmentTrackingSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  shipmentId!: string;

  @Column()
  normalizedStatus!: string; // in_transit, out_for_delivery, delivered, failed_attempt, returned

  @Column({ nullable: true })
  rawStatus?: string; // Carrier's exact raw status string

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  eventTimestamp?: Date;

  @ManyToOne(() => Shipment, (shipment) => shipment.snapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipmentId' })
  shipment!: Shipment;

  @CreateDateColumn()
  createdAt!: Date;
}
