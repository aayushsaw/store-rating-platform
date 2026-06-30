import { createApp } from '@/app.js';
import { env } from '@/config/env.js';
import { prisma } from '@/lib/prisma.js';

const app = createApp();

async function start() {
  try {
    await prisma.$connect();
    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
