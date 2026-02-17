import { UserStatus } from '../../common/enums';

export class VigilanteListItemDto {
  id: string;
  phone: string;
  status: UserStatus;
  createdAt: string; // ISO date
}
