import {
  IsIn,
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IdentificationType } from '../../common/enums';

export class ScanVisitDto {
  @IsIn(['entry', 'exit'], { message: 'eventType debe ser "entry" o "exit"' })
  eventType: 'entry' | 'exit';

  /** Medio de identificación con que se identificó el visitante. Requerido al registrar entrada. */
  @ValidateIf((o) => o.eventType === 'entry')
  @IsEnum(IdentificationType, {
    message: 'El medio de identificación debe ser INE, pasaporte o licencia',
  })
  identificationType?: IdentificationType;

  /** Indica si el visitante entra con vehículo. Solo al registrar entrada. */
  @ValidateIf((o) => o.eventType === 'entry')
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasVehicle?: boolean;

  /** Placa del vehículo. Requerida si hasVehicle es true al registrar entrada. */
  @ValidateIf((o) => o.eventType === 'entry' && o.hasVehicle === true)
  @IsNotEmpty({ message: 'Ingresa la placa del vehículo' })
  @IsString()
  @MaxLength(20, { message: 'La placa no puede exceder 20 caracteres' })
  licensePlate?: string;

  /** Comentario o incidencia al registrar la salida (opcional). */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  exitComment?: string;
}
