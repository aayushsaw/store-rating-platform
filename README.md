# ⭐ RateStore — Store Rating & Discovery Platform

[![CI Build](https://github.com/aayushsaw/store-rating-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/aayushsaw/store-rating-platform/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.9-0c344b?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18.0-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Code Style](https://img.shields.io/badge/code__style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)

A modern, high-performance, and secure store rating and discovery platform built with a monorepo architecture. RateStore features a handcrafted **Stripe/Linear-inspired dark UI** design system, secure JWT rotation, role-based access control, transaction rollback guards, and a robust integration test suite.

---

## 📖 Project Overview

RateStore is designed to create a transparent, reliable channel of communication between customers, store owners, and platform administrators:

- **For Customers**: Provides a Yelp/Google Maps-style split-pane feed to search, filter, and review nearby registered venues with responsive star sliders and comment feeds.
- **For Store Owners**: Offers a Trustpilot Business-style analytics board displaying average ratings, review logs, and star frequency distributions.
- **For Platform Administrators**: Features a secure control panel managing user profiles, soft deletes, and a transactional wizard to create stores and owners simultaneously.

---

## 🎨 System Architecture

```
                       ┌──────────────────────┐
                       │  Vite React Client   │
                       │ (Redux / RTK Query)  │
                       └──────────┬───────────┘
                                  │ HTTPS
                                  ▼
                       ┌──────────────────────┐
                       │ Express Node Server  │
                       │ (TypeScript / Pino)  │
                       └──────────┬───────────┘
                                  │ Prisma Client
                                  ▼
                       ┌──────────────────────┐
                       │   PostgreSQL DB      │
                       │  (Migrations / SQL)  │
                       └──────────────────────┘
```

---

## 🔐 Authentication & Session Security Flow

RateStore utilizes a secure token rotation workflow to enforce secure session management:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Application
    actor Server as Express API Gateway
    actor DB as PostgreSQL Session Store

    User->>Server: POST /auth/login {email, password}
    alt Valid Credentials
        Server->>DB: Create RefreshToken (UUID, metadata, userAgent, ipAddress)
        Server->>User: Set-Cookie: refresh_token (HttpOnly, Secure, SameSite=Lax, path=/api/v1/auth/refresh)
        Server->>User: Response body: { accessToken (15m expiration, HS256) }
    else Invalid
        Server->>User: HTTP 401 Unauthorized
    end

    Note over User, Server: Client accesses Protected Routes using Authorization: Bearer <accessToken>

    User->>Server: Access Protected Endpoint (expired token)
    Server->>User: HTTP 401 Token Expired

    User->>Server: POST /auth/refresh (Cookie: refresh_token)
    Server->>DB: Check if token exists & is active
    alt Token Active
        Server->>DB: Invalidate old token & Issue new rotating RefreshToken
        Server->>User: Set-Cookie: new_refresh_token
        Server->>User: Response body: { accessToken }
    else Token Reused (Attack Vector)
        Server->>DB: Token Reuse Guard! Invalidate ALL active sessions for this user
        Server->>User: HTTP 401 Session Revoked
    end
```

---

## ✨ Features by Role

### 🛡️ System Administrators (`SYSTEM_ADMIN`)

- **Live Overview**: Stripe-style metrics summary including active accounts, store counts, review numbers, and average score metrics.

* **Activity Ledger**: Recent user register streams, new store setups, and real-time review submissions.
* **User Management**: Compact Vercel-style tabular rows with sorting (createdAt, name, email, role), role filters, search matching, and soft-delete/reactivation tools.
* **Self-deletion Guard**: Rejects administrative self-deletion and last-active admin deletion attempts.
* **Store Setup Wizard**: Multi-step modal wizard executing a transaction to create a store and its owner account atomically, rolling back database states on duplicate keys.

### 🛍️ Customers (`NORMAL_USER`)

- **Maps/Yelp Discovery Screen**: High-density store listings side-by-side with detail panels.
- **Search & Filters**: Alphabetical and ratings-based sort controls, plus dynamic search queries.
- **Interactive Review Card**: Custom star slider components with micro-scale animations and comments.
- **Review History Ledger**: Paginated feeds showing individual reviewer names, timestamps, and commentary.

### 📈 Store Owners (`STORE_OWNER`)

- **Analytics Indicators**: Trustpilot-style widgets highlighting overall scores, total reviews, and five-star rating counts.
- **Histogram Distribution**: Star frequency progress bars highlighting review percentages.
- **Owner Review Ledger**: Chronologically sorted reviews submitted for the owner's specific store.

---

## 🛠️ Technology Stack

| Domain               | Technologies                              | Details                                      |
| :------------------- | :---------------------------------------- | :------------------------------------------- |
| **Frontend**         | React 19, TypeScript 5.8, Vite 6.3        | Fast builds, type-safe components            |
| **Styling**          | Vanilla CSS, TailwindCSS 3.4              | Custom theme tokens, dark mode design system |
| **State & Fetching** | Redux Toolkit, React Query (TanStack)     | Global states, robust request caching        |
| **Backend**          | Express 5.1, tsx, tsc-alias               | Hot reloading, path alias mappings           |
| **Database**         | PostgreSQL 18.0, Prisma ORM 6.9           | Parameterized queries, schema migrations     |
| **Testing**          | Vitest 4.1, Supertest 7.2                 | Fast integration test runs                   |
| **DevOps & Linting** | Docker Compose, Husky, ESLint 9, Prettier | Code consistency, pre-commit validation      |

---

## 📁 Repository Structure

```
store-rating-platform/
├── .github/workflows/   # CI pipeline workflows
├── client/              # React application source code
│   ├── src/             # Components, pages, hooks, state slices
│   └── tailwind.config  # Custom brand design extends
├── server/              # Express API source code
│   ├── prisma/          # Schema definitions & database migrations
│   └── src/             # Routes, controllers, middlewares, tests
├── packages/shared/     # Monorepo shared library (Zod validation schemas)
├── screenshots/         # Public repository screenshots
└── docker-compose.yml   # Docker compose configurations for PostgreSQL
```

---

## 🚀 Local Setup Instructions

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Docker Desktop** (or a local PostgreSQL server)

### 1. Install Dependencies

Install all workspace dependencies from the root directory:

```bash
npm install
```

### 2. Configure Environment Variables

Copy the templates into configuration files:

```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Launch Database Container

Start the PostgreSQL container using Docker Compose:

```bash
npm run db:up
```

### 4. Deploy Prisma Migrations

Generate the client files and run database schema migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 5. Seed Demo Data

Populate the database with realistic demo accounts, stores, and ratings:

```bash
npm run db:seed
```

### 6. Launch Development Workspaces

Start both development servers concurrently:

```bash
# Terminal 1 — API Gateway
npm run dev:server

# Terminal 2 — Frontend Application
npm run dev:client
```

- **React Frontend**: `http://localhost:5173`
- **Express Swagger Portal**: `http://localhost:3001/api-docs`

---

## 📊 Environment Variables

### Backend Configuration (`server/.env`)

| Variable        | Description                       | Example                                                                                      |
| :-------------- | :-------------------------------- | :------------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | PostgreSQL DB connection URI      | `postgresql://store_rating:store_rating_secret@localhost:5432/store_rating_db?schema=public` |
| `PORT`          | API Server port                   | `3001`                                                                                       |
| `JWT_SECRET`    | Secret token signing string       | `super_secret_jwt_sign_key_here`                                                             |
| `BCRYPT_ROUNDS` | Salt rounds for hashing passwords | `12`                                                                                         |
| `NODE_ENV`      | Application environment state     | `development`                                                                                |

---

## 📐 Validation Constraints

RateStore enforces absolute Zod validation parameters:

| Parameter         | Constraint                                | Error Message                                         |
| :---------------- | :---------------------------------------- | :---------------------------------------------------- |
| **Full Name**     | Length: `8 – 60` characters               | `Name must be at least 8 characters`                  |
| **Password**      | Length: `8 – 16` characters               | `Password must be at least 8 characters`              |
| **Password Rule** | At least 1 uppercase, 1 special character | `Password must contain at least one uppercase letter` |
| **Address**       | Length: Max `400` characters              | `Address must be at most 400 characters`              |
| **Rating**        | Integer range: `1 – 5`                    | `Rating must be an integer between 1 and 5`           |

---

## 📸 Screenshots

### Yelp-Style Customer Discovery Screen

![Yelp-Style Store Feed](screenshots/customer_discovery.png)

### Stripe-Style Administrative Console

![Admin Portal Dashboard](screenshots/admin_dashboard.png)

---

## 🧪 Testing & Verification Results

Our monorepo implements a full, sequential integration testing suite with vitest:

```bash
# Execute integration tests
npx vitest run -w server --fileParallelism=false
```

```
✓ dist/tests/auth.test.js (21 tests)
✓ dist/tests/admin.test.ts (14 tests)
✓ dist/tests/rating.test.js (11 tests)

Test Files  6 passed (6)
     Tests  92 passed (92)
```

- **Lint status**: Clean (0 errors, 0 warnings).
- **TypeScript compiles**: Clean.

---

## 🚢 Deployment Guidelines

### Frontend Deployment (Vercel / Netlify)

1. Set the root workspace directory as `/client`.
2. Configure **Build Command**: `npm run build`.
3. Configure **Output Directory**: `dist`.
4. Configure environment variable `VITE_API_URL` pointing to your deployed API server endpoint.

### Backend Deployment (Render / Heroku / AWS)

1. Set the root directory as `/server` or execute from monorepo root using workspace options.
2. Build command: `npm run build -w server`.
3. Set environment variable `DATABASE_URL` pointing to your production database.
4. Execute `npx prisma migrate deploy` in post-build phases to apply migrations.

### Database Deployment (RDS / Neon)

1. Launch a PostgreSQL instance.
2. Provide the production database connection string to your Express backend environment context.

---

## 🔮 Future Improvements

1. **Interactive Leaflet Map**: Embed geolocation coordinates and interactive maps alongside store lists.
2. **Review Image Attachments**: Allow customers to upload images together with comments.
3. **Advanced Admin Audit Panels**: View complete session logs and IP tracking stats.

---

## 👤 Author

**Aayush Saw**

- **GitHub**: [github.com/aayushsaw](https://github.com/aayushsaw)
- **LinkedIn**: [linkedin.com/in/aayush-saw](https://www.linkedin.com/in/aayush-saw-0428261ba/)
- **Email**: [aayushsaw13@gmail.com](mailto:aayushsaw13@gmail.com)
