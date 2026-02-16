import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateVigilanteDto } from './dto/create-vigilante.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('vigilantes')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createVigilante(@Body() dto: CreateVigilanteDto) {
    return this.usersService.createVigilante(dto.phone, dto.password);
  }
}
