import { UserStatus } from '../../common/enums';

export class VecinoListItemDto {
  id: string;
  phone: string;
  status: UserStatus;
  street: string;
  number: string;
  letter?: string | null;
  createdAt: string; // ISO date
}
