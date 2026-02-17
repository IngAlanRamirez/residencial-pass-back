import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RegistrationStatus } from '../../common/enums';
import { User } from './user.entity';

@Entity('registration_requests')
export class RegistrationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column()
  street: string;

  @Column()
  number: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  letter: string | null;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  /** ID del usuario (admin) que aprobó o rechazó esta solicitud. */
  @Column({ name: 'validated_by_id', nullable: true })
  validatedById: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Usuario (admin) que aprobó o rechazó esta solicitud. */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'validated_by_id' })
  validatedBy: User | null;
}
