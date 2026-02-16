import { IsEnum } from 'class-validator';
import { RegistrationStatus } from '../../common/enums';

export class UpdateRegistrationStatusDto {
  @IsEnum(RegistrationStatus, {
    message: 'El estado debe ser approved o rejected',
  })
  status: RegistrationStatus.APPROVED | RegistrationStatus.REJECTED;
}
