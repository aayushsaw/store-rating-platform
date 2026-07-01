import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { env } from '@/config/env.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { healthRouter } from '@/routes/health.routes.js';
import { authRouter } from '@/routes/auth.routes.js';
import { adminRouter } from '@/routes/admin.routes.js';
import { storeRouter } from '@/routes/store.routes.js';
import { ownerRouter } from '@/routes/owner.routes.js';
import { logger } from '@/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.isDevelopment ? false : undefined,
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );

  // ── Request logging (Pino HTTP) ─────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      // Don't log health checks to reduce noise
      autoLogging: {
        ignore: (req) => req.url === '/api/v1/health',
      },
    }),
  );

  // ── Body / Cookie parsing ───────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // ── Swagger UI ──────────────────────────────────────────────────────────────
  try {
    const openapiPath = path.resolve(__dirname, 'docs', 'openapi.yaml');
    const openapiDoc = yaml.parse(fs.readFileSync(openapiPath, 'utf8')) as object;
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(openapiDoc, {
        customSiteTitle: 'Store Rating Platform – API Docs',
        swaggerOptions: { persistAuthorization: true },
      }),
    );
  } catch (err) {
    logger.warn({ err }, 'Could not load OpenAPI spec – Swagger UI disabled');
  }

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use('/api/v1', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/stores', storeRouter);
  app.use('/api/v1/owner', ownerRouter);

  // ── Global error handler (must be last) ─────────────────────────────────────
  app.use(errorHandler);

  return app;
}
