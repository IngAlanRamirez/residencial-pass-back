import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Device, RegistrationRequest } from '../database/entities';
import { UserRole, UserStatus, RegistrationStatus } from '../common/enums';
import { MeResponseDto } from './dto/me-response.dto';
import { VigilanteListItemDto } from './dto/vigilante-list-item.dto';
import { VecinoListItemDto } from './dto/vecino-list-item.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone },
      relations: { device: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { device: true },
    });
  }

  async getProfile(userId: string): Promise<MeResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, phone: true, role: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const result: MeResponseDto = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
    if (user.role === UserRole.VECINO || user.role === UserRole.ADMIN) {
      const request = await this.registrationRequestRepository.findOne({
        where: { userId },
        select: { id: true, street: true, number: true, letter: true },
      });
      if (request) {
        result.address = {
          street: request.street,
          number: request.number,
          letter: request.letter ?? undefined,
        };
      }
    }
    return result;
  }

  async findAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
  }

  async createVigilante(phone: string, password: string): Promise<User> {
    const existing = await this.findByPhone(phone);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese teléfono');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      phone,
      passwordHash,
      role: UserRole.VIGILANCIA,
      status: UserStatus.ACTIVE,
    });
    return this.userRepository.save(user);
  }

  async findVigilantes(): Promise<VigilanteListItemDto[]> {
    const users = await this.userRepository.find({
      where: { role: UserRole.VIGILANCIA },
      select: { id: true, phone: true, status: true, createdAt: true },
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => ({
      id: u.id,
      phone: u.phone,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async deleteVigilante(vigilanteId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: vigilanteId, role: UserRole.VIGILANCIA },
    });
    if (!user) {
      throw new NotFoundException('Vigilante no encontrado');
    }
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  /** Lista vecinos y administradores aprobados (con domicilio). Incluye admins porque también son vecinos. */
  async findVecinos(): Promise<VecinoListItemDto[]> {
    const rows = await this.registrationRequestRepository.find({
      where: { status: RegistrationStatus.APPROVED },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    const fromRequests = rows
      .filter((r) => r.user && (r.user.role === UserRole.VECINO || r.user.role === UserRole.ADMIN))
      .map((r) => ({
        id: r.user!.id,
        phone: r.user!.phone,
        status: r.user!.status,
        role: r.user!.role as 'vecino' | 'admin',
        street: r.street,
        number: r.number,
        letter: r.letter ?? null,
        createdAt: r.user!.createdAt.toISOString(),
      }));

    const idsFromRequests = new Set(fromRequests.map((v) => v.id));
    const adminsWithoutRequest = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: { id: true, phone: true, status: true, createdAt: true },
      order: { createdAt: 'DESC' },
    });
    const adminsToAdd = adminsWithoutRequest
      .filter((a) => !idsFromRequests.has(a.id))
      .map((a) => ({
        id: a.id,
        phone: a.phone,
        status: a.status,
        role: 'admin' as const,
        street: '-',
        number: '-',
        letter: null as string | null,
        createdAt: a.createdAt.toISOString(),
      }));

    return [...fromRequests, ...adminsToAdd].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /** Suspender vecino por falta de pago. Solo admin. */
  async suspendVecino(vecinoId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: vecinoId, role: UserRole.VECINO },
    });
    if (!user) {
      throw new NotFoundException('Vecino no encontrado');
    }
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  /** Reactivar vecino (p. ej. tras regularizar pago). Solo admin. */
  async reactivateVecino(vecinoId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: vecinoId, role: UserRole.VECINO },
    });
    if (!user) {
      throw new NotFoundException('Vecino no encontrado');
    }
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);
  }

  async registerDevice(userId: string, deviceId: string): Promise<Device> {
    const existing = await this.deviceRepository.findOne({
      where: { userId },
    });
    if (existing) {
      return existing;
    }
    const device = this.deviceRepository.create({ userId, deviceId });
    return this.deviceRepository.save(device);
  }

  async getDeviceByUserId(userId: string): Promise<Device | null> {
    return this.deviceRepository.findOne({ where: { userId } });
  }

  async updateDevice(userId: string, deviceId: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({ where: { userId } });
    if (!device) {
      return this.registerDevice(userId, deviceId);
    }
    device.deviceId = deviceId;
    return this.deviceRepository.save(device);
  }
}
