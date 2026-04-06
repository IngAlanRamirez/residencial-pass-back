import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateVigilanteDto {
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
