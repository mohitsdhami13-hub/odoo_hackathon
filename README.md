# Odoo Hackathon 2026

> Problem Statement: _TBD — will be added once revealed at the start of the event_

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **ORM:** Prisma

## Getting Started

1. Clone the repo and install dependencies:
```bash
   npm install
```

2. Set up your environment variables — copy `.env.example` to `.env` and fill in your local PostgreSQL connection string:
```bash
   cp .env.example .env
```

3. Run database migrations:
```bash
   npx prisma migrate dev
```

4. Start the development server:
```bash
   npm run dev
```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `app/` — pages and API routes
- `components/` — reusable UI components
- `lib/` — Prisma client, validation schemas, utilities
- `prisma/schema.prisma` — database schema

## Team

- [Mohit] — Solo participant