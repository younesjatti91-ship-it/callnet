import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserStoreAssignment } from './UserStoreAssignment';

export enum UserRoleEnum {
  SUPERADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  MODERATOR = 'Moderator',
  MANAGER = 'Manager',
  AGENT = 'Agent',
  SELLER = 'Seller',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  name!: string;

  @Column({
    type: 'varchar',
    default: UserRoleEnum.SELLER,
  })
  role!: UserRoleEnum;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @OneToMany(() => UserStoreAssignment, (assignment: UserStoreAssignment) => assignment.user)
  storeAssignments!: UserStoreAssignment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
