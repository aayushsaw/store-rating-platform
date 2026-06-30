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
} as const;
