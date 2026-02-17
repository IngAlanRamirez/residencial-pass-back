import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// En desarrollo: usar SOLO .env.local (nunca .env de producción)
// En producción: usar .env o variables de Railway
const cwd = process.cwd();
const envLocal = resolve(cwd, '.env.local');
const envDefault = resolve(cwd, '.env');

if (process.env.NODE_ENV !== 'production' && existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else {
  dotenv.config({ path: envDefault });
}

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/** Orígenes que Capacitor usa en dispositivos nativos (siempre necesarios). */
const CAPACITOR_ORIGINS = [
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
];

const DEV_ORIGINS = [
  ...CAPACITOR_ORIGINS,
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost:8101',
  'https://app.residencialpass.com',
  'http://app.residencialpass.com',
];

function buildAllowedOrigins(): Set<string> {
  const env = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const isProd = process.env.NODE_ENV === 'production';
  const list = isProd ? [...CAPACITOR_ORIGINS, ...env] : [...DEV_ORIGINS, ...env];
  return new Set(list);
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const allowedOrigins = buildAllowedOrigins();
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
