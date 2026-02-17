import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  User,
  Device,
  RegistrationRequest,
  RecoveryRequest,
  Street,
  Visit,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const db = config.get('database');
        const useSsl = db?.ssl === true;
        return {
          type: 'postgres',
          host: db?.host ?? 'localhost',
          port: db?.port ?? 5432,
          username: db?.username ?? 'residencial',
          password: db?.password ?? 'residencial',
          database: db?.database ?? 'residencial_pass',
          entities: [User, Device, RegistrationRequest, RecoveryRequest, Street, Visit],
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
          ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Device,
      RegistrationRequest,
      RecoveryRequest,
      Street,
      Visit,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
