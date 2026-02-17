import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationRequest, User } from '../database/entities';
import { RegistrationStatus, UserStatus } from '../common/enums';

@Injectable()
export class RegistrationRequestsService {
  constructor(
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllPending() {
    const rows = await this.registrationRequestRepository.find({
      where: { status: RegistrationStatus.PENDING },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      street: r.street,
      number: r.number,
      letter: r.letter,
      status: r.status,
      createdAt: r.createdAt,
      user: r.user ? { id: r.user.id, phone: r.user.phone } : null,
    }));
  }

  async updateStatus(
    id: string,
    status: RegistrationStatus.APPROVED | RegistrationStatus.REJECTED,
    adminId: string,
  ) {
    const request = await this.registrationRequestRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (request.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('La solicitud ya fue procesada');
    }

    request.status = status;
    request.validatedById = adminId;
    await this.registrationRequestRepository.save(request);

    const newUserStatus =
      status === RegistrationStatus.APPROVED
        ? UserStatus.ACTIVE
        : UserStatus.INACTIVE;
    await this.userRepository.update(request.userId, {
      status: newUserStatus,
    });

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
      select: { id: true, phone: true },
    });

    return {
      message:
        status === RegistrationStatus.APPROVED
          ? 'Solicitud aprobada. El vecino ya puede iniciar sesión.'
          : 'Solicitud rechazada.',
      validatedById: adminId,
      validatedBy: admin ? { id: admin.id, phone: admin.phone } : null,
    };
  }
}
