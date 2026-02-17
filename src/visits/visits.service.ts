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

  async findOne(visitId: string, userId: string, userRole: string) {
    const visit = await this.visitRepository.findOne({
      where: { id: visitId },
    });
    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }
    const isOwner = visit.createdById === userId;
    const isAdmin = userRole === UserRole.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tiene permiso para ver esta visita');
    }
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
    };
  }
}
