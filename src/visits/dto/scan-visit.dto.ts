import { IsIn } from 'class-validator';

export class ScanVisitDto {
  @IsIn(['entry', 'exit'], { message: 'eventType debe ser "entry" o "exit"' })
  eventType: 'entry' | 'exit';
}
