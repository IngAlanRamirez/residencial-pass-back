import { UserRole, UserStatus } from '../../common/enums';

export class AddressDto {
  street: string;
  number: string;
  letter?: string | null;
}

export class MeResponseDto {
  id: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  address?: AddressDto | null;
}
