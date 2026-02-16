import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateStreetDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la calle es requerido' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  name: string;
}
