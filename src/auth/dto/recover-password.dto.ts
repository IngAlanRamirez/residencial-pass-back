import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class RecoverPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'El teléfono actual es requerido' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'El nuevo teléfono es requerido' })
  @Matches(/^\+?[0-9\s-]{10,}$/, {
    message: 'Formato de teléfono no válido',
  })
  newPhone: string;
}
