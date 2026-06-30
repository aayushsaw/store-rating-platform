# Store Rating Platform

A monorepo web application for submitting and managing store ratings, built for the Roxiler MERN Assessment.

## Tech Stack

| Layer      | Technologies                                                      |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React, TypeScript, Tailwind CSS, Redux Toolkit, React Query, Vite |
| Backend    | Express.js, TypeScript, Prisma ORM                                |
| Database   | PostgreSQL                                                        |
| Auth (M1+) | JWT, Refresh Tokens, RBAC                                         |

## Monorepo Structure

```
store-rating-platform/
├── client/              # React frontend
├── server/              # Express API + Prisma
├── packages/shared/     # Shared types and constants
├── docker-compose.yml   # Local PostgreSQL
└── .github/workflows/   # CI pipeline
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for PostgreSQL)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Start PostgreSQL

```bash
npm run db:up
```

### 4. Run database migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start development servers

```bash
# Terminal 1 — API
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

- Frontend: http://localhost:5173
- API health: http://localhost:3001/api/v1/health

## Available Scripts

| Script                | Description                      |
| --------------------- | -------------------------------- |
| `npm run dev:client`  | Start Vite dev server            |
| `npm run dev:server`  | Start Express with hot reload    |
| `npm run build`       | Build shared, client, and server |
| `npm run lint`        | Run ESLint across the monorepo   |
| `npm run format`      | Format code with Prettier        |
| `npm run typecheck`   | TypeScript check all packages    |
| `npm run db:up`       | Start PostgreSQL container       |
| `npm run db:down`     | Stop PostgreSQL container        |
| `npm run db:migrate`  | Run Prisma migrations (dev)      |
| `npm run db:generate` | Generate Prisma client           |

## Architecture Decisions

- **Monorepo** with npm workspaces
- **Admin creates Store + Store Owner** in a single workflow (M2)
- **Admins can rate stores**
- **Store owners cannot rate their own store**
- **Soft delete** for users (`deletedAt` column)
- **Shared types** in `@store-rating/shared`

## Development Milestones

| Milestone | Status      | Scope                                      |
| --------- | ----------- | ------------------------------------------ |
| M0        | ✅ Complete | Monorepo bootstrap, tooling, Prisma schema |
| M1        | Pending     | Authentication (JWT + refresh + RBAC)      |
| M2        | Pending     | Admin module                               |
| M3        | Pending     | Normal user module                         |
| M4        | Pending     | Store owner module                         |
| M5        | Pending     | Frontend polish                            |
| M6        | Pending     | Testing                                    |
| M7        | Pending     | Deployment                                 |

## License

Private — assessment project.
