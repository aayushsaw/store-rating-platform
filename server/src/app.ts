import cors from 'cors';
import express from 'express';
import { env } from '@/config/env.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { healthRouter } from '@/routes/health.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use('/api/v1', healthRouter);

  app.use(errorHandler);

  return app;
}
