import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VECINO, UserRole.ADMIN)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateVisitDto,
  ) {
    return this.visitsService.create(userId, dto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.visitsService.findOne(id, user.sub, user.role);
  }
}
