export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'residencial',
    password: process.env.DB_PASSWORD ?? 'residencial',
    database: process.env.DB_NAME ?? 'residencial_pass',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
  recovery: {
    linkBaseUrl: process.env.RECOVERY_LINK_BASE_URL ?? 'https://app.example.com/reset',
    tokenExpiresInHours: 24,
  },
});
