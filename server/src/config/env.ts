import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.SERVER_PORT ?? 3001),
  databaseUrl: requireEnv('DATABASE_URL'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',

  // JWT
  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  // Security
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
} as const;
