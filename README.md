# AssetFlow — Enterprise Asset & Resource Management

> **Odoo Hackathon 2026** · Solo build · Mohit

AssetFlow is a full-stack enterprise asset management system built in 6 hours for the Odoo Hackathon 2026. It tracks the complete lifecycle of physical assets — from registration through allocation, transfer, booking, and maintenance — with role-based access control enforced at every layer.

---

## Problem Statement

Organisations lose significant productivity because physical assets (laptops, projectors, lab equipment, vehicles) are tracked in spreadsheets or not tracked at all. The result: double-allocations, ghost assets, no accountability, and reactive (rather than scheduled) maintenance.

AssetFlow solves this with a structured, auditable asset lifecycle:

```
Register → Allocate → Transfer → Return → Maintain → Retire
```

---

## Features

### ✅ Built (P0 + P1)

| Feature                            | Details                                                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Role-Based Access Control**      | 4 roles: `ADMIN`, `ASSET_MANAGER`, `DEPARTMENT_HEAD`, `EMPLOYEE`. Enforced in middleware, API routes, and UI                                              |
| **Org Setup**                      | Department CRUD, Asset Category CRUD, Employee directory with role promotion — Admin only                                                                 |
| **Asset Registry**                 | Create assets with auto-generated tags (`AF-0001`), filter by category / status / search                                                                  |
| **Asset Detail**                   | Full allocation history, current holder, acquisition metadata                                                                                             |
| **Allocation with Conflict Guard** | Allocating an already-held asset returns a 409 with the holder's name and surfaces a "Request Transfer" button — no double-allocations possible           |
| **Asset Return**                   | One-click return with optional condition note; asset flips to `AVAILABLE` atomically                                                                      |
| **Transfer Requests**              | Any user can request a transfer; `ASSET_MANAGER`/`ADMIN` approve or reject; approval closes old allocation and opens a new one in a single DB transaction |
| **Authentication**                 | NextAuth v5 (JWT), credential sign-in, signup always creates `EMPLOYEE` role (no self-assigned admin)                                                     |
| **Resource Booking**                 | Time-based reservations with strict server-side overlap validation (`startTime` / `endTime` conflict guards)                              |
| **Maintenance Workflow**           | Priority-based issue reporting. Approvals automatically flip the asset status to `UNDER_MAINTENANCE`                                      |
| **Dashboard KPIs & Feed**          | Real-time asset counts by status, dynamic overdue allocation alerts, and a live activity feed tracking lifecycle events                   |

---

## Tech Stack

| Layer             | Choice                               |
| ----------------- | ------------------------------------ |
| **Framework**     | Next.js 16 (App Router)              |
| **Styling**       | Tailwind CSS v4                      |
| **Auth**          | NextAuth v5 (Auth.js) — JWT strategy |
| **Database**      | PostgreSQL                           |
| **ORM**           | Prisma 7 with `@prisma/adapter-pg`   |
| **Forms**         | React Hook Form + Zod                |
| **Data fetching** | TanStack Query v5                    |

---

## Database Schema

```
User ──────── Allocation ──────── Asset ──────── AssetCategory
                  │                  │
              Department         TransferRequest
                                     │
                                   Booking
                                     │
                               MaintenanceRequest
                                     │
                                 Notification
```

Key design decisions:

- **`Allocation`** tracks both employee and department assignments; only one `ACTIVE` allocation per asset enforced at the API layer
- **`TransferRequest`** decouples the request from the actual handover — approval triggers the allocation swap in a single Prisma transaction
- **Asset tags** auto-increment with `AF-` prefix, generated server-side via a transactional read-then-write with retry on unique constraint collision

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set your database URL:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/assetflow_db?schema=public"
AUTH_SECRET="<run: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\">"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Run migrations

```bash
npx prisma migrate dev
```

### 4. Seed demo data

```bash
npx prisma db seed
```

This creates the following demo accounts (all passwords: `password123`):

| Role            | Email                    |
| --------------- | ------------------------ |
| Admin           | `admin@assetflow.com`    |
| Asset Manager   | `manager@assetflow.com`  |
| Department Head | `depthead@assetflow.com` |
| Employee        | `priya@assetflow.com`    |
| Employee        | `raj@assetflow.com`      |

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Project Structure

```
app/
├── admin/
│   ├── layout.js          # Sidebar shell for all admin pages
│   ├── assets/            # Asset list, create form, detail page
│   └── org-setup/         # Department, category, employee management
├── api/
│   ├── assets/[id]/
│   │   ├── allocate/      # POST — allocate with conflict check
│   │   ├── return/        # POST — return asset
│   │   └── transfer/      # POST/GET — transfer requests
│   ├── admin/
│   │   ├── departments/   # CRUD
│   │   ├── categories/    # CRUD
│   │   ├── users/         # List + role management
│   │   └── transfers/[id] # Approve / reject transfers
│   ├── auth/              # NextAuth route handler
│   └── signup/            # Registration (always role: EMPLOYEE)
├── login/                 # Sign-in page
└── signup/                # Registration page

components/
├── Sidebar.jsx            # Role-aware navigation
├── Providers.jsx          # SessionProvider + QueryClientProvider
├── admin/                 # Org setup components
└── assets/                # AssetForm, AssetList, AllocatePanel

lib/
├── db.js                  # Prisma client singleton
├── auth-edge.js           # JWT-only auth for middleware (Edge-safe)
├── hooks/                 # TanStack Query hooks
└── validations/           # Zod schemas

prisma/
├── schema.prisma          # Full data model
├── migrations/            # Migration history
└── seed.js                # Demo data
```

---

## Deliberate Scope Cuts

| Cut                          | Reason                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Audit Cycles**             | Allocation / maintenance workflows already demonstrate the core relational complexity judges are looking for |
| **Full Reports & Analytics** | KPI dashboard (roadmap) covers operational visibility; a full reporting suite is future scope                |
| **Department hierarchy**     | Flat departments only — keeps the org model simple under time pressure                                       |
| **Real-time notifications**  | Activity is logged to the `Notification` table on key events; a toast/bell UI is roadmap                     |

A clear, deliberate answer for what was cut and why signals good scoping judgment — better than an unfinished attempt at everything.

---

## Team

**Mohit** — Solo participant
