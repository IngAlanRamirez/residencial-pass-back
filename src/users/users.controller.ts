import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateVigilanteDto } from './dto/create-vigilante.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get('vigilantes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listVigilantes() {
    return this.usersService.findVigilantes();
  }

  @Post('vigilantes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createVigilante(@Body() dto: CreateVigilanteDto) {
    return this.usersService.createVigilante(dto.phone, dto.password);
  }

  @Delete('vigilantes/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteVigilante(@Param('id') id: string) {
    await this.usersService.deleteVigilante(id);
  }

  @Get('vecinos')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listVecinos() {
    return this.usersService.findVecinos();
  }

  @Post('vecinos/:id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async suspendVecino(@Param('id') id: string) {
    await this.usersService.suspendVecino(id);
  }

  @Post('vecinos/:id/reactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reactivateVecino(@Param('id') id: string) {
    await this.usersService.reactivateVecino(id);
  }
}
