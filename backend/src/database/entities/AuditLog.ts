import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ nullable: true })
  storeId?: string;

  @Index()
  @Column({ nullable: true })
  userId?: string;

  @Column()
  action!: string; // order.created, order.status_changed, integration.connected, broadcast.sent, reconciliation.discrepancy_resolved

  @Column({ nullable: true })
  entityType?: string; // Order, Store, Integration, WhatsAppConnection

  @Column({ nullable: true })
  entityId?: string;

  @Column('simple-json', { nullable: true })
  details?: Record<string, any>;

  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
