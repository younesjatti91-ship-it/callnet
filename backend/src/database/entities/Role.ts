import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string; // Admin, Moderator, Manager, Agent, Seller

  @Column({ nullable: true })
  description?: string;

  @Column('simple-json', { nullable: true })
  permissions?: string[];

  @CreateDateColumn()
  createdAt!: Date;
}
