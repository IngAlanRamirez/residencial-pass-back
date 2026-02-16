import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Device } from '../database/entities';
import { UserRole, UserStatus } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
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
