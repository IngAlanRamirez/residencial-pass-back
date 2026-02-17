import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ScanVisitDto {
  @IsIn(['entry', 'exit'], { message: 'eventType debe ser "entry" o "exit"' })
  eventType: 'entry' | 'exit';

  /** Comentario o incidencia al registrar la salida (opcional). */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede exceder 500 caracteres' })
  exitComment?: string;
}
