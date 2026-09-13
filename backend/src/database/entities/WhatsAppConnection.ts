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

export enum WhatsAppStatusEnum {
  STARTING = 'STARTING',
  SCAN_QR_CODE = 'SCAN_QR_CODE',
  WORKING = 'WORKING',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED',
}

@Entity('whatsapp_connections')
export class WhatsAppConnection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  storeId!: string;

  @Column({ unique: true })
  sessionName!: string; // e.g. store-abc-session

  @Column({ default: 'NOWEB' })
  engine!: string; // NOWEB, WEBJS, GOWS

  @Column({
    type: 'varchar',
    default: WhatsAppStatusEnum.STOPPED,
  })
  status!: WhatsAppStatusEnum;

  @Column({ nullable: true })
  connectedPhone?: string;

  @Column({ nullable: true })
  label?: string; // e.g. "Main Support", "Sales Line 1"

  @Column({ type: 'text', nullable: true })
  qrCodeRaw?: string; // QR code data URL or raw string

  @Column({ default: true })
  isDefault!: boolean;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store!: Store;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
