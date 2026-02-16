/**
 * Script para crear el primer administrador y las calles por defecto en desarrollo.
 * Ejecutar: npm run seed
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  Street,
  Device,
  RegistrationRequest,
  RecoveryRequest,
} from './entities';
import { UserRole, UserStatus } from '../common/enums';

const phone = process.env.SEED_ADMIN_PHONE ?? '5550000000';
const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

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
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'residencial',
    password: process.env.DB_PASSWORD ?? 'residencial',
    database: process.env.DB_NAME ?? 'residencial_pass',
    entities: [User, Street, Device, RegistrationRequest, RecoveryRequest],
    synchronize: true, // Crea las tablas si no existen (solo para dev/seed inicial)
  });

  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const streetRepo = dataSource.getRepository(Street);

  const existingAdmin = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await userRepo.save(
      userRepo.create({
        phone,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      }),
    );
    console.log(`Administrador creado: teléfono ${phone}, contraseña ${password}`);
  } else {
    console.log('Ya existe un administrador. No se crea otro.');
  }

  const existingStreets = await streetRepo.count();
  if (existingStreets === 0) {
    for (const name of DEFAULT_STREETS) {
      await streetRepo.save(streetRepo.create({ name }));
    }
    console.log(`${DEFAULT_STREETS.length} streets created.`);
  } else {
    console.log('Streets already exist. Skipping default streets.');
  }

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
