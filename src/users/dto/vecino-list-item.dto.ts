import { UserStatus } from '../../common/enums';

export class VecinoListItemDto {
  id: string;
  phone: string;
  status: UserStatus;
  role: 'vecino' | 'admin';
  street: string;
  number: string;
  letter?: string | null;
  createdAt: string; // ISO date
}
