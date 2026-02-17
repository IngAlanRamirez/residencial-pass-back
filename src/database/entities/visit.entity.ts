import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VisitReason, VisitStatus, IdentificationType } from '../../common/enums';
import { User } from './user.entity';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'visitor_name', length: 200 })
  visitorName: string;

  @Column({
    name: 'identification_type',
    type: 'enum',
    enum: IdentificationType,
  })
  identificationType: IdentificationType;

  @Column({
    type: 'enum',
    enum: VisitReason,
  })
  reason: VisitReason;

  @Column({ name: 'entry_open_schedule', default: false })
  entryOpenSchedule: boolean;

  @Column({ name: 'exit_open_schedule', default: false })
  exitOpenSchedule: boolean;

  @Column({ name: 'entry_at', type: 'timestamptz', nullable: true })
  entryAt: Date | null;

  @Column({ name: 'exit_at', type: 'timestamptz', nullable: true })
  exitAt: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @Column()
  street: string;

  @Column()
  number: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  letter: string | null;

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.PENDING,
  })
  status: VisitStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;
}
