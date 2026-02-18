import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { ScanVisitDto } from './dto/scan-visit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /** Lista: vecino/admin = visitas que creó; vigilante = visitas que escaneó (entrada/salida). */
  @Get()
  @Roles(UserRole.VECINO, UserRole.ADMIN, UserRole.VIGILANCIA)
  async list(@CurrentUser() user: CurrentUserPayload) {
    return this.visitsService.listByRole(user.sub, user.role);
  }

  @Post()
  @Roles(UserRole.VECINO, UserRole.ADMIN)
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateVisitDto,
  ) {
    return this.visitsService.create(userId, dto);
  }

  /** Estado de escaneo (solo vigilante). Debe ir antes de GET :id para que /:id/scan-status no se matchee como id. */
  @Get(':id/scan-status')
  @Roles(UserRole.VIGILANCIA)
  async getScanStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitsService.getScanStatus(id);
  }

  @Get(':id')
  @Roles(UserRole.VECINO, UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.visitsService.findOneForCreator(id, userId);
  }

  /** Cancelar visita (solo vecino/admin creador, solo si está pendiente). */
  @Patch(':id/cancel')
  @Roles(UserRole.VECINO, UserRole.ADMIN)
  async cancel(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.visitsService.cancel(id, userId);
  }

  /** Registrar escaneo de entrada o salida (solo vigilante). */
  @Post(':id/scan')
  @Roles(UserRole.VIGILANCIA)
  async registerScan(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') vigilanteId: string,
    @Body() body: ScanVisitDto,
  ) {
    return this.visitsService.registerScan(
      id,
      vigilanteId,
      body.eventType,
      body.identificationType,
      body.hasVehicle,
      body.licensePlate,
      body.exitComment,
    );
  }
}
