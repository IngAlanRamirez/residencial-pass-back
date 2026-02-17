import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { VisitReason, IdentificationType } from '../../common/enums';

export class CreateVisitDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del visitante es requerido' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  visitorName: string;

  @IsEnum(IdentificationType, {
    message: 'El medio de identificación debe ser INE, pasaporte o licencia',
  })
  identificationType: IdentificationType;

  @IsEnum(VisitReason, {
    message: 'El motivo debe ser visitante, proveedor, servicios u otros',
  })
  reason: VisitReason;

  @IsBoolean()
  entryOpenSchedule: boolean;

  @IsBoolean()
  exitOpenSchedule: boolean;

  @ValidateIf((o) => !o.entryOpenSchedule)
  @IsDateString({}, { message: 'La fecha y hora de entrada es requerida cuando no es entrada abierta' })
  entryAt?: string;

  @ValidateIf((o) => !o.exitOpenSchedule)
  @IsDateString({}, { message: 'La fecha y hora de salida es requerida cuando no es salida abierta' })
  exitAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;
}
