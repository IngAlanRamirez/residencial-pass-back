/**
 * Script para crear las calles por defecto.
 * Ejecutar: npm run seed
 */
import { DataSource } from 'typeorm';
import {
  User,
  Street,
  Device,
  RegistrationRequest,
  RecoveryRequest,
} from './entities';

const DEFAULT_STREETS = [
  'San Agustin Zhao Rong',
  'San Juan de Dukla',
  'San Jose Maria Escriva',
  'San Benito Menni',
  'San Marcelino Champagnat',
  'San Juan Diego',
  'Santa Ines de Bohemia',
  'Santa Eduvigis',
  'San Maximiliano Maria Kolbe',
];

async function seed() {
  const useSsl = process.env.DB_SSL === 'true';
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'residencial',
    password: process.env.DB_PASSWORD ?? 'residencial',
    database: process.env.DB_NAME ?? 'residencial_pass',
    entities: [User, Street, Device, RegistrationRequest, RecoveryRequest],
    synchronize: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  await dataSource.initialize();
  const streetRepo = dataSource.getRepository(Street);

  const existingStreets = await streetRepo.count();
  if (existingStreets === 0) {
    for (const name of DEFAULT_STREETS) {
      await streetRepo.save(streetRepo.create({ name }));
    }
    console.log(`${DEFAULT_STREETS.length} calles creadas.`);
  } else {
    console.log('Las calles ya existen. No se crean nuevas.');
  }

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
