import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller('legal')
export class LegalController {
  @Public()
  @Get('privacy-policy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPrivacyPolicy(): string {
    const path = join(process.cwd(), 'public', 'privacy-policy.html');
    return readFileSync(path, 'utf-8');
  }
}
