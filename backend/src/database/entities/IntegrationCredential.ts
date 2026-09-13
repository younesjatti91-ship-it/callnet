import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('integration_credentials')
@Index(['entityType', 'entityId'], { unique: true })
export class IntegrationCredential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entityType!: string; // 'store_integration', 'courier_account', 'whatsapp_connection'

  @Column()
  entityId!: string; // Foreign ID referencing the integration or connection

  @Column({ type: 'text' })
  encryptedPayload!: string; // AES-256-GCM ciphertext formatted iv:tag:encrypted

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
