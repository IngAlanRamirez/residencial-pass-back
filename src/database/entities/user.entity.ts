import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole, UserStatus } from '../../common/enums';
import { Device } from './device.entity';
import { RegistrationRequest } from './registration-request.entity';
import { RecoveryRequest } from './recovery-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Device, (device) => device.user, { nullable: true })
  device: Device | null;

  @OneToMany(() => RegistrationRequest, (req) => req.user)
  registrationRequests: RegistrationRequest[];

  @OneToMany(() => RecoveryRequest, (req) => req.user)
  recoveryRequests: RecoveryRequest[];
}
