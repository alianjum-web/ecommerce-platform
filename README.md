# Ecommerce Platform

Full-stack ecommerce application with a `Next.js` client and an `Express + Prisma` API server.

## Tech Stack

- Frontend: `Next.js`, `React`, `TypeScript`, `Tailwind CSS`, `Radix UI`, `Zustand`
- Backend: `Express`, `TypeScript`, `Prisma`, `PostgreSQL`
- Integrations: `Stripe`, `PayPal`, `Cloudinary`, `Nodemailer`
- Validation and auth utilities: `zod`, `jose`, `jsonwebtoken`, cookie-based auth flow

## Project Structure

```text
ecommerce-platform/
├─ client/   # Next.js storefront + app routes + admin UI
└─ server/   # Express API + Prisma schema/migrations
```

## Prerequisites

- `Node.js` 20+
- `npm` 10+
- `PostgreSQL` (or a compatible hosted database)

## Quick Start

1. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Create environment files from examples:
   ```bash
   cp server/.env.example server/.env.local
   cp client/.env.example client/.env.local
   ```
3. Update values in your local env files (`DATABASE_URL`, JWT/Stripe/Cloudinary keys, API URL, etc.).
4. Run Prisma migrations and generate client:
   ```bash
   cd server
   npm run prisma:migrate:dev
   npm run prisma:generate
   ```
5. Start both apps in separate terminals:
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

Default local ports:
- Frontend: `http://localhost:3012`
- Backend: `http://localhost:4001`

## Environment Variables

Use `server/.env.example` and `client/.env.example` as templates.

Server loading behavior:
- Backend runtime (single startup load in `server/src/server.ts`): loads `server/.env.local` then `server/.env` in development, and `server/.env.production` then `server/.env` in production
- Prisma CLI (`server/prisma.config.ts`) loads env separately for Prisma commands
- Platform variables (Render/Railway/etc.) are not overridden by file values.

Important variables include:
- Server: `DATABASE_URL`, `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, payment/email/cloud storage keys
- Client: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`, and other client runtime flags

Never commit real secrets. Keep `.env.local` and production secrets in your deployment platform.

## Scripts

### Client (`client/package.json`)
- `npm run dev` - Start Next.js in development mode on port `3012`
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run linting

### Server (`server/package.json`)
- `npm run dev` - Start Express server with `nodemon`
- `npm run build` - Generate Prisma client and compile TypeScript
- `npm run start` - Start compiled server from `dist`
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Create/apply development migrations
- `npm run prisma:migrate:deploy` - Apply production migrations
- `npm run prisma:seed` - Seed database

## API Overview

The backend mounts routes under `/api`:

- `/api/auth`
- `/api/products`
- `/api/coupon`
- `/api/settings`
- `/api/cart`
- `/api/address`
- `/api/order`
- `/api/warm`

## Deployment Notes

- Client and server are deployed independently.
- For the backend, make sure Prisma generate + migrations run during build/release (`render-build` script is already included).
- Set production secrets in your platform environment manager (do not store them in git).