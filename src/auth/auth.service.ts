import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  User,
  Device,
  RegistrationRequest,
  RecoveryRequest,
} from '../database/entities';
import { UserRole, UserStatus, RegistrationStatus } from '../common/enums';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterVecinoDto } from './dto/register-vecino.dto';
import { LoginDto } from './dto/login.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(RegistrationRequest)
    private readonly registrationRequestRepository: Repository<RegistrationRequest>,
    @InjectRepository(RecoveryRequest)
    private readonly recoveryRequestRepository: Repository<RecoveryRequest>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerVecino(dto: RegisterVecinoDto) {
    const existing = await this.usersService.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese teléfono');
    }

    const street = dto.street.trim();
    const number = dto.number.trim();
    const letter = dto.letter?.trim() || null;
    const existingDomicilio = await this.registrationRequestRepository
      .createQueryBuilder('r')
      .where('r.street = :street', { street })
      .andWhere('r.number = :number', { number })
      .andWhere('(r.letter = :letter OR (r.letter IS NULL AND :letter IS NULL))', {
        letter,
      })
      .getOne();
    if (existingDomicilio) {
      throw new ConflictException(
        'Ya existe un registro para este domicilio (calle, número y letra). Solo puede haber un registro por domicilio.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      phone: dto.phone,
      passwordHash,
      role: UserRole.VECINO,
      status: UserStatus.PENDING,
    });
    const savedUser = await this.userRepository.save(user);

    const registrationRequest = this.registrationRequestRepository.create({
      userId: savedUser.id,
      street,
      number,
      letter,
      status: RegistrationStatus.PENDING,
    });
    await this.registrationRequestRepository.save(registrationRequest);

    const device = this.deviceRepository.create({
      userId: savedUser.id,
      deviceId: dto.deviceId,
    });
    await this.deviceRepository.save(device);

    const admins = await this.usersService.findAdmins();
    if (admins.length > 0) {
      await this.notificationsService.notifyAdminsNewRegistration({
        adminPhones: admins.map((a) => a.phone),
        residentPhone: dto.phone,
        street,
        number,
        letter: letter ?? undefined,
      });
    }

    return {
      message: 'Registro exitoso. Un administrador validará tu cuenta.',
      userId: savedUser.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('Teléfono o contraseña incorrectos');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Cuenta pendiente de validación o inactiva. Contacta al administrador.',
      );
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Teléfono o contraseña incorrectos');
    }

    // Vigilantes no tienen restricción por dispositivo. SKIP_DEVICE_CHECK=true la omite para todos (review Google).
    const skipDeviceCheck =
      user.role === UserRole.VIGILANCIA ||
      this.configService.get<string>('SKIP_DEVICE_CHECK') === 'true';
    if (!skipDeviceCheck) {
      const device = await this.usersService.getDeviceByUserId(user.id);
      if (device && device.deviceId !== dto.deviceId) {
        throw new ForbiddenException(
          'Solo puedes iniciar sesión desde el dispositivo registrado.',
        );
      }
      if (!device) {
        await this.usersService.registerDevice(user.id, dto.deviceId);
      }
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async recoverPassword(dto: RecoverPasswordDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new BadRequestException(
        'No se encontró una cuenta con ese teléfono.',
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresInHours =
      this.configService.get<number>('recovery.tokenExpiresInHours') ?? 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const recoveryRequest = this.recoveryRequestRepository.create({
      userId: user.id,
      newPhone: dto.newPhone,
      token,
      expiresAt,
    });
    await this.recoveryRequestRepository.save(recoveryRequest);

    const baseUrl =
      this.configService.get<string>('recovery.linkBaseUrl') ?? '';
    const link = `${baseUrl}?token=${token}`;

    await this.notificationsService.sendRecoveryLink({
      phone: dto.newPhone,
      link,
      message: `Recuperación de cuenta Residencial Pass. Accede al enlace (válido ${expiresInHours}h): ${link}`,
    });

    const admins = await this.usersService.findAdmins();
    if (admins.length > 0) {
      await this.notificationsService.notifyAdminsRecoveryRequest({
        adminPhones: admins.map((a) => a.phone),
        userPhone: dto.phone,
        newPhone: dto.newPhone,
      });
    }

    return {
      message:
        'Se ha enviado un enlace de recuperación al nuevo teléfono por WhatsApp y SMS.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const recovery = await this.recoveryRequestRepository.findOne({
      where: { token: dto.token },
      relations: { user: true },
    });
    if (!recovery) {
      throw new BadRequestException('Token inválido o expirado.');
    }
    if (recovery.usedAt) {
      throw new BadRequestException('Este enlace ya fue utilizado.');
    }
    if (new Date() > recovery.expiresAt) {
      throw new BadRequestException('El enlace ha expirado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.userRepository.update(recovery.userId, {
      phone: dto.phone,
      passwordHash,
    });
    await this.usersService.updateDevice(recovery.userId, dto.deviceId);
    await this.recoveryRequestRepository.update(recovery.id, {
      usedAt: new Date(),
    });

    return {
      message: 'Contraseña y datos actualizados correctamente. Ya puedes iniciar sesión.',
    };
  }

  async validateUserForJwt(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }
}
