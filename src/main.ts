import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const DEV_ORIGINS = [
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost:8101',
  'https://localhost',
  'capacitor://localhost',
  'https://app.residencialpass.com',
  'http://app.residencialpass.com',
];

function getCorsOrigin(): string[] | true {
  const env = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) return env.length > 0 ? env : true;
  return [...new Set([...env, ...DEV_ORIGINS])];
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const corsOrigin = getCorsOrigin();
  app.enableCors({
    origin: corsOrigin,
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
