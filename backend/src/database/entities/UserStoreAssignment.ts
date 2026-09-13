import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Store } from './Store';

@Entity('user_store_assignments')
@Index(['userId', 'storeId'], { unique: true })
export class UserStoreAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  storeId!: string;

  @Column({ default: 'Agent' })
  assignedRole!: string; // Manager, Agent, Moderator

  @ManyToOne(() => User, (user: User) => user.storeAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store!: Store;

  @CreateDateColumn()
  createdAt!: Date;
}
