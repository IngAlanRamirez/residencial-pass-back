import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterVecinoDto {
  @IsString()
  @IsNotEmpty({ message: 'La calle es requerida' })
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'El número es requerido' })
  number: string;

  @IsString()
  @IsOptional()
  letter?: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^\+?[0-9\s-]{10,}$/, {
    message: 'Formato de teléfono no válido',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El deviceId es requerido' })
  deviceId: string;
}
