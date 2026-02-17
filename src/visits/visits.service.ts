import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit, RegistrationRequest } from '../database/entities';
import { VisitReason, VisitStatus, UserRole } from '../common/enums';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
  ) {}

  async create(createdById: string, dto: CreateVisitDto) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let entryAt: Date | null = null;
    let exitAt: Date | null = null;

    if (!dto.entryOpenSchedule && dto.entryAt) {
      entryAt = new Date(dto.entryAt);
      if (entryAt < startOfToday) {
        throw new BadRequestException(
          'La fecha de entrada debe ser hoy o en el futuro',
        );
      }
    }

    if (!dto.exitOpenSchedule && dto.exitAt) {
      exitAt = new Date(dto.exitAt);
      if (entryAt !== null && exitAt <= entryAt) {
        throw new BadRequestException(
          'La hora de salida debe ser posterior a la de entrada',
        );
      }
      if (exitAt < startOfToday) {
        throw new BadRequestException(
          'La fecha de salida debe ser hoy o en el futuro',
        );
      }
    }

    const address = await this.registrationRequestRepository.findOne({
      where: { userId: createdById },
      select: { street: true, number: true, letter: true },
    });
    if (!address) {
      throw new ForbiddenException(
        'Debes tener un domicilio registrado para crear una visita',
      );
    }

    const visit = this.visitRepository.create({
      visitorName: dto.visitorName.trim(),
      identificationType: dto.identificationType,
      reason: dto.reason,
      entryOpenSchedule: dto.entryOpenSchedule,
      exitOpenSchedule: dto.exitOpenSchedule,
      entryAt,
      exitAt,
      description: dto.description?.trim() || null,
      createdById,
      street: address.street,
      number: address.number,
      letter: address.letter,
      status: VisitStatus.PENDING,
    });
    const saved = await this.visitRepository.save(visit);

    return this.toResponse(saved);
  }

  /** Lista según rol: vecino/admin = visitas que creó; vigilante = visitas que escaneó. */
  async listByRole(userId: string, userRole: string) {
    if (userRole === UserRole.VIGILANCIA) {
      return this.findMyScannedVisits(userId);
    }
    return this.findMyCreatedVisits(userId);
  }

  /** Visitaciones creadas por el usuario (vecino o admin). */
  async findMyCreatedVisits(userId: string) {
    const visits = await this.visitRepository.find({
      where: { createdById: userId },
      order: { createdAt: 'DESC' },
    });
    return visits.map((v) => this.toResponse(v));
  }

  /** Visitaciones en las que el vigilante registró entrada o salida. */
  async findMyScannedVisits(vigilanteId: string) {
    const visits = await this.visitRepository
      .createQueryBuilder('v')
      .where('v.scanned_by_entry_id = :id OR v.scanned_by_exit_id = :id', {
        id: vigilanteId,
      })
      .orderBy('v.entry_at', 'DESC', 'NULLS LAST')
      .addOrderBy('v.exit_at', 'DESC', 'NULLS LAST')
      .getMany();
    return visits.map((v) => this.toResponse(v));
  }

  /** Detalle de una visita: solo el usuario que la creó puede verla (y recuperar QR). Visitaciones canceladas no pueden consultarse. */
  async findOneForCreator(visitId: string, userId: string) {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
    });
    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }
    if (visit.createdById !== userId) {
      throw new ForbiddenException('No tiene permiso para ver esta visita');
    }
    if (visit.status === VisitStatus.CANCELLED) {
      throw new ForbiddenException('Esta visita fue cancelada y ya no puede consultarse');
    }
    if (visit.status === VisitStatus.FINISHED) {
      throw new ForbiddenException('Esta visita ya finalizó y no puede consultarse el detalle');
    }
    return this.toResponse(visit);
  }

  /** Vigilante registra escaneo de entrada o salida. */
  async registerScan(
    visitId: string,
    vigilanteId: string,
    eventType: 'entry' | 'exit',
  ) {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
    });
    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }

    if (eventType === 'entry') {
      if (visit.scannedByEntryId) {
        throw new BadRequestException('La entrada de esta visita ya fue registrada');
      }
      if (visit.entryOpenSchedule) {
        visit.entryAt = new Date();
      }
      visit.scannedByEntryId = vigilanteId;
      visit.status = VisitStatus.USED;
    } else {
      if (visit.scannedByExitId) {
        throw new BadRequestException('La salida de esta visita ya fue registrada');
      }
      if (!visit.scannedByEntryId) {
        throw new BadRequestException(
          'Debe registrar primero la entrada antes de la salida',
        );
      }
      visit.exitAt = new Date();
      visit.scannedByExitId = vigilanteId;
      visit.status = VisitStatus.FINISHED;
    }

    await this.visitRepository.save(visit);
    return this.toResponse(visit);
  }

  /** Cancelar visita: solo el creador, solo si está pendiente. */
  async cancel(visitId: string, userId: string) {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
    });
    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }
    if (visit.createdById !== userId) {
      throw new ForbiddenException('No tiene permiso para cancelar esta visita');
    }
    if (visit.status !== VisitStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden cancelar visitas pendientes',
      );
    }
    visit.status = VisitStatus.CANCELLED;
    await this.visitRepository.save(visit);
    return this.toResponse(visit);
  }

  private toResponse(visit: Visit) {
    return {
      id: visit.id,
      visitorName: visit.visitorName,
      identificationType: visit.identificationType,
      reason: visit.reason,
      entryOpenSchedule: visit.entryOpenSchedule,
      exitOpenSchedule: visit.exitOpenSchedule,
      entryAt: visit.entryAt,
      exitAt: visit.exitAt,
      description: visit.description,
      street: visit.street,
      number: visit.number,
      letter: visit.letter,
      status: visit.status,
      createdAt: visit.createdAt,
      scannedByEntryId: visit.scannedByEntryId ?? undefined,
      scannedByExitId: visit.scannedByExitId ?? undefined,
    };
  }
}
