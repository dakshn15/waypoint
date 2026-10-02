<div align="center">

# 🧭 Waypoint

**A full-stack, multi-tenant travel platform with AI-powered trip planning.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-000000)](https://better-auth.com/)

[Features](#-features) · [Tech Stack](#%EF%B8%8F-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [Project Structure](#-project-structure) · [Demo Accounts](#-seed-data--demo-accounts)

</div>

---

## 📖 Overview

Waypoint is a production-grade SaaS platform that connects travelers with travel agencies through an **AI-powered trip builder**, real-time booking management, and a multi-tenant agency console. Built with **Next.js 16**, **Prisma**, and the **Google Gemini AI SDK**, it features role-based dashboards, **Razorpay** payment integration, a commission & payout ledger, and a modern glassmorphic UI with dark mode.

The platform supports **four distinct user roles** — each with dedicated dashboards, workflows, and server-side permission enforcement:

| Role | Description |
|:---|:---|
| 🧳 **Traveler** | Browse packages, book trips, use the AI trip builder, leave reviews, manage profile |
| 🏢 **Agency** | Create packages, manage staff & vendors, track bookings, request payouts |
| 👥 **Staff** | Operate within an agency scope — handle tasks, bookings, and day-to-day ops |
| 👑 **Admin** | Platform-wide oversight — users, agencies, settings, commission, audit logs |

---

## ✨ Features

### 🤖 AI Trip Builder

- Generate personalized, day-by-day itineraries powered by **Google Gemini AI**
- Configure destination, travel dates, budget, group size, travel style (Budget → Luxury), and interests
- AI produces structured itineraries with activities, hotels, transport, and a full cost breakdown
- Save, edit, and book AI-generated trips directly from the builder
- View and manage saved trips from the dashboard

### 👤 Traveler Experience

- Browse and search published travel packages with filters for duration, price, and difficulty
- View detailed package pages with day-by-day itineraries, inclusions/exclusions, and reviews
- **Multi-traveler booking flow** with passenger details, special requests, and date selection
- Payment processing via **Razorpay** (UPI, Card, Net Banking, Wallet)
- Unified dashboard: upcoming trips, booking history, AI-generated trips, favorites, and notifications
- Profile management with passport, nationality, emergency contacts, and travel preferences

### 🏢 Agency Console

- **Package Designer** — Create multi-day packages with destinations (geocoded pins), pricing, departure dates, itineraries with hotels/transport/activities, inclusions, exclusions, and image galleries. Manage draft → published → archived lifecycle
- **Staff Management** — Invite team members, assign roles (Manager, Agent, Support), toggle active status, and revoke access
- **Vendor Hub** — Register and manage third-party partners (Hotels, Transport, Guides, Activities, Restaurants) with contact info, ratings, and categories
- **Booking Tracker** — View all client reservations, confirm payments, and update booking statuses
- **Task Board** — Create, assign, and track operational tasks with priority levels and due dates
- **Analytics Dashboard** — Revenue charts, booking trends, and performance metrics
- **Payout Management** — View commission deductions, settlement history, and bank account configuration

### 👑 Platform Admin

- **System Overview** — Platform-wide metrics: total bookings, active users, agencies, and monthly revenue
- **User Directory** — Search, filter, create, and modify user roles across the entire platform
- **Agency Oversight** — Create, verify, suspend, and manage all registered agencies with full operational data
- **Platform Settings** — Configure global commission rates, minimum payout thresholds, hold periods, and support contacts
- **Audit Trail** — Timestamped logs of every administrative action with actor, resource, and before/after snapshots

### 🔔 Notifications & Email

- Real-time in-app notification center with categorized alerts (Booking, Payment, Trip, System, Promotion)
- Transactional email delivery via **Nodemailer/SMTP** for booking confirmations, payment receipts, password resets, and status updates

---

## 🛡️ Security & Authorization

| Layer | Implementation |
|:---|:---|
| **Authentication** | Better Auth with credential + Google OAuth providers, session management, and password reset flow |
| **Role-Based Access** | Four roles (`TRAVELER`, `AGENCY`, `STAFF`, `ADMIN`) enforced in every Server Action and API route |
| **Multi-Tenant Isolation** | Agency-scoped data isolation — staff and agencies only access their own data; Admin has platform-wide bypass |
| **Server Action Guards** | Ownership verification on every mutation — create, update, and delete operations check `agencyId` before executing |
| **Payment Idempotency** | `PaymentEvent` model prevents duplicate webhook processing with gateway + event ID deduplication |
| **Audit Logging** | All administrative mutations recorded with actor, action, resource type, and before/after snapshots |
| **Storage Polyfill** | Client-side `localStorage`/`sessionStorage` fallback for sandboxed iframes and strict privacy modes |

---

## 🛠️ Tech Stack

| Category | Technology |
|:---|:---|
| **Framework** | [Next.js 16](https://nextjs.org/) — App Router, Server Actions, Turbopack |
| **Language** | [TypeScript 5](https://typescriptlang.org/) (strict mode) |
| **Database** | [PostgreSQL 16](https://postgresql.org/) via [Prisma ORM 6](https://prisma.io/) |
| **Authentication** | [Better Auth](https://better-auth.com/) — Credentials + Google OAuth |
| **AI Engine** | [Google Generative AI SDK](https://ai.google.dev/) — Gemini |
| **Payments** | [Razorpay](https://razorpay.com/) — UPI, Card, Net Banking, Wallet |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) — Glassmorphism, dark mode, micro-animations |
| **UI Components** | [Base UI](https://base-ui.com/), [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.dev/) toasts |
| **Charts** | [Recharts](https://recharts.org/) — Custom dark-mode tooltips and responsive layouts |
| **Animations** | [Framer Motion](https://motion.dev/) |
| **Carousel** | [Swiper](https://swiperjs.com/) |
| **Forms** | [Zod](https://zod.dev/) validation + React `useState` controlled forms |
| **Email** | [Nodemailer](https://nodemailer.com/) — HTML email templates with SMTP transport |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |
| **Testing** | Node.js native test runner via [tsx](https://tsx.is/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** 16+ (or use the included Docker Compose)
- A [Google Gemini API key](https://aistudio.google.com/apikey) for the AI Trip Builder
- *(Optional)* Google OAuth credentials for social login
- *(Optional)* Razorpay API keys for payment processing
- *(Optional)* SMTP credentials for transactional emails

### 1. Clone & Install

```bash
git clone https://github.com/dakshn15/waypoint.git
cd waypoint
npm install
```

### 2. Start the Database

**Option A** — Use the bundled Docker Compose:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container at `localhost:5432` with user `postgres`, password `password`, and database `waypoint`.

**Option B** — Point to your own PostgreSQL instance by updating `DATABASE_URL` in `.env`.

### 3. Configure Environment

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/waypoint?schema=public"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Application URL (used by auth client)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Razorpay (optional)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""

# Email / SMTP (optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
FROM_EMAIL="noreply@waypoint.dev"
```

### 4. Initialize the Database

```bash
npx prisma db push    # Sync schema to PostgreSQL
npx prisma db seed    # Populate demo data
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌱 Seed Data & Demo Accounts

Running `npx prisma db seed` populates a **fully showcase-ready demo database** with loginable accounts, packages, bookings, payments, reviews, and more.

### Demo Accounts

> All demo accounts use password: **`password123`**

| Role | Email | Name | Description |
|:---|:---|:---|:---|
| 👑 **Admin** | `admin@waypoint.dev` | Daksh Nimavat | Platform administrator — full access to users, agencies, settings, and audit logs |
| 🏢 **Agency** | `agency@waypoint.dev` | Wanderlust Travels | Agency owner — manages packages, staff, vendors, bookings, and payouts |
| 👥 **Staff** | `staff@waypoint.dev` | Ananya Desai | Agency staff (Manager) — handles tasks, bookings, and operations for Wanderlust |
| 🧳 **Traveler** | `traveler@waypoint.dev` | Rahul Sharma | Demo traveler — has bookings, favorites, reviews, notifications, and a filled profile |

### Demo Data Inventory

| Data | Count | Details |
|:---|:---:|:---|
| **Packages** | 8 | All published |
| **Itineraries** | 6 days | Day-by-day plans with activities, hotels, and transport for Golden Triangle & Kerala |
| **Bookings** | 8 | Confirmed, Pending, Processing, Completed, and Cancelled statuses |
| **Payments** | 6 | UPI, Card, Net Banking, and Wallet via Razorpay |
| **Reviews** | 8 | Varied ratings (4–5 stars) with detailed comments per package |
| **Vendors** | 5 | Hotel, Transport, Guide, Activity, and Restaurant partners |
| **Tasks** | 3 | Completed, In Progress, and Todo with priorities |
| **Notifications** | 7 | Mix of read/unread: booking, payment, trip, system, and promotion |
| **Favorites** | 2 | Traveler's saved packages |
| **Audit Logs** | 3 | Agency verification, package publish, settings change |
| **Platform Settings** | ✓ | 10% commission, ₹500 min payout, 7-day hold |

### Packages

| Package | Duration | Price (₹) | Difficulty | Status |
|:---|:---:|:---:|:---|:---:|
| Golden Triangle Tour | 7 days | 24,999 | Easy | Published |
| Kerala Backwaters Bliss | 5 days | 18,999 | Easy | Published |
| Himalayan Adventure | 10 days | 35,999 | Challenging | Published |
| Goa Beach Paradise | 4 days | 12,999 | Easy | Published |
| Rajasthan Royal Heritage | 8 days | 29,999 | Moderate | Published |
| Northeast Explorer | 6 days | 22,999 | Moderate | Published |
| Varanasi Spiritual Ganges | 5 days | 16,999 | Easy | Published |
| Kashmir Valley & Gulmarg | 6 days | 27,999 | Moderate | Published |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
│   React 19 · Framer Motion · Recharts · Swiper · Sonner     │
└───────────────────────┬─────────────────────────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │     Next.js 16 App Router   │
         │  ┌───────────┬────────────┐ │
         │  │  Server   │  API       │ │
         │  │  Actions  │  Routes    │ │
         │  └─────┬─────┴─────┬──────┘ │
         │        │           │        │
         │  ┌─────▼───────────▼──────┐ │
         │  │  lib/permissions.ts    │ │◄── Role-based access control
         │  │  (Authorization)       │ │
         │  └─────────┬─────────────┘  │
         │   Middleware (proxy.ts)      │◄── Route protection
         └────────────┼────────────────┘
                      │
     ┌────────────────┼─────────────────────┐
     │                │                     │
     ▼                ▼                     ▼
┌─────────┐   ┌──────────────┐    ┌──────────────┐
│ Prisma  │   │  Gemini AI   │    │   Razorpay   │
│  ORM    │   │    SDK       │    │  Gateway     │
└────┬────┘   └──────────────┘    └──────────────┘
     │
     ▼
┌────────────┐
│ PostgreSQL │
│    16      │
└────────────┘
```

### Data Flow

1. **Authentication** — Better Auth manages sessions, credentials, and Google OAuth. Sessions are stored server-side in PostgreSQL.
2. **Authorization** — Every Server Action calls `getUserAgencyAccess()` from `lib/permissions.ts` to resolve the caller's agency scope. Admin role bypasses tenant isolation.
3. **AI Trip Generation** — The `/api/trips` route sends structured prompts to Gemini, parses the response into `Trip`, `Itinerary`, `Activity`, `ItineraryHotel`, and `ItineraryTransport` records.
4. **Payments** — Razorpay orders are created server-side, completed client-side, then verified via webhook with idempotency guards (`PaymentEvent` model).
5. **Commission & Payouts** — Platform takes a configurable commission (default 10%, overridable per-agency). `AgencyPayout` records track settlement periods with gross/net amounts and bank transfer references.

---

## 📂 Project Structure

```
waypoint/
├── app/
│   ├── (auth)/                  # Auth pages (login, register, forgot/reset password)
│   ├── about/                   # About page
│   ├── contact/                 # Contact page
│   ├── privacy/                 # Privacy policy
│   ├── terms/                   # Terms of service
│   ├── packages/                # Public package listing & detail pages
│   │   └── [id]/                #   Package detail, reviews, booking form
│   ├── trip-builder/            # AI trip builder workspace
│   │   └── [id]/                #   Saved trip detail view
│   ├── actions/                 # Server Actions
│   │   ├── admin.ts             #   Platform admin mutations
│   │   ├── account.ts           #   User account operations
│   │   ├── bookings.ts          #   Booking CRUD
│   │   ├── packages.ts          #   Package CRUD (with admin bypass)
│   │   ├── payout-actions.ts    #   Commission & payout operations
│   │   ├── profile.ts           #   User profile mutations
│   │   ├── reviews.ts           #   Review submissions
│   │   ├── settings-actions.ts  #   Platform settings mutations
│   │   ├── settings.ts          #   User-level settings
│   │   ├── staff.ts             #   Staff invite, role, status management
│   │   ├── tasks.ts             #   Task board CRUD
│   │   ├── trips.ts             #   AI trip management
│   │   └── vendors.ts           #   Vendor partnership CRUD
│   ├── api/
│   │   ├── auth/                #   Better Auth API handler
│   │   ├── chat/                #   AI chat endpoint
│   │   ├── favorites/           #   Wishlist toggle
│   │   ├── notifications/       #   Notification polling
│   │   ├── payments/            #   Razorpay order creation & webhooks
│   │   └── trips/               #   AI trip generation endpoint
│   ├── dashboard/
│   │   ├── page.tsx             #   Unified dashboard (routes by role)
│   │   ├── agencies/            #   Admin: agency directory
│   │   ├── analytics/           #   Agency: revenue & booking charts
│   │   ├── audit-logs/          #   Admin: platform audit trail
│   │   ├── bookings/            #   Booking management
│   │   ├── favorites/           #   Traveler: saved packages
│   │   ├── packages/            #   Agency: package designer & editor
│   │   ├── payments/            #   Payment history
│   │   ├── payouts/             #   Admin/Agency: commission & settlements
│   │   ├── profile/             #   User profile editor
│   │   ├── settings/            #   Admin: platform settings
│   │   ├── staff/               #   Agency: staff management
│   │   ├── tasks/               #   Agency: task board
│   │   ├── travelers/           #   Agency: traveler directory
│   │   ├── trips/               #   Traveler: AI-generated trips
│   │   ├── users/               #   Admin: user directory & role editor
│   │   └── vendors/             #   Agency: vendor partnerships
│   ├── sitemap.ts               # Dynamic sitemap generation
│   ├── robots.ts                # Robots.txt configuration
│   ├── not-found.tsx            # Custom 404 page
│   ├── error.tsx                # Global error boundary
│   └── layout.tsx               # Root layout (fonts, providers, metadata)
├── components/
│   ├── layout/                  # Header, sidebar, footer, dashboard shell
│   └── ui/                      # 21 reusable UI primitives (dialog, table, etc.)
├── constants/                   # Navigation links & layout config
├── hooks/                       # Custom React hooks (useMobile)
├── lib/
│   ├── ai.ts                    # Gemini AI prompt engineering & response parsing
│   ├── audit.ts                 # Audit log helper
│   ├── auth.ts                  # Better Auth server config
│   ├── auth-client.ts           # Better Auth client config
│   ├── booking-rules.ts         # Booking validation rules
│   ├── commission.ts            # Commission rate resolution & platform settings
│   ├── currency.ts              # Multi-currency formatting utilities
│   ├── db.ts                    # Prisma client singleton
│   ├── email.ts                 # Email templates & SMTP transport
│   ├── payments.ts              # Razorpay SDK initialization
│   ├── permissions.ts           # Central RBAC — getUserAgencyAccess()
│   ├── storage-polyfill.ts      # localStorage/sessionStorage fallback
│   ├── trip-images.ts           # Trip image utilities
│   ├── utils.ts                 # General utilities (cn, formatDate, etc.)
│   └── validation.ts            # Zod schemas for form validation
├── prisma/
│   ├── schema.prisma            # Database schema (25 models, 18 enums)
│   └── seed.ts                  # Demo data seeder
├── public/
│   └── images/                  # Logos and static assets
├── scripts/
│   └── fix-package-slugs.ts     # Maintenance: backfill package slugs
├── tests/
│   ├── booking-rules.test.ts    # Booking validation tests
│   └── currency.test.ts         # Currency formatting tests
├── proxy.ts                     # Middleware — route protection
├── docker-compose.yml           # PostgreSQL 16 dev container
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json
```

---

## 🧪 Testing

```bash
npm test
```

Runs the test suite using Node.js native test runner via `tsx`:

- `tests/booking-rules.test.ts` — Booking validation logic (cutoff dates, passenger limits)
- `tests/currency.test.ts` — Multi-currency formatting utilities (INR, USD, EUR)

---

## 📦 Available Scripts

| Script | Command | Description |
|:---|:---|:---|
| **Dev** | `npm run dev` | Start development server with Turbopack |
| **Build** | `npm run build` | Create production build |
| **Start** | `npm start` | Start production server |
| **Lint** | `npm run lint` | Run ESLint |
| **Test** | `npm test` | Run test suite |
| **DB Push** | `npx prisma db push` | Sync schema to database |
| **DB Seed** | `npx prisma db seed` | Populate demo data |
| **Prisma Studio** | `npx prisma studio` | Open database GUI |

---

## 🗄️ Database Schema

The Prisma schema defines **25 models** and **18 enums** covering:

| Domain | Models |
|:---|:---|
| **Auth & Users** | `User`, `Session`, `Account`, `Verification`, `TravelerProfile` |
| **Agencies** | `Agency`, `AgencyStaff` |
| **Packages** | `Package`, `Itinerary`, `Activity`, `ItineraryHotel`, `ItineraryTransport` |
| **Bookings** | `Booking`, `BookingTraveler`, `Payment`, `PaymentEvent` |
| **AI Trips** | `Trip`, `TripItinerary`, `TripActivity` |
| **Operations** | `Vendor`, `Task`, `Review`, `Favorite`, `Notification` |
| **Admin** | `PlatformSetting`, `AgencyPayout`, `AuditLog` |

---

## 📜 License

This project is not currently published under a specific license. All rights reserved.

---

<div align="center">

Built with ❤️ by [Daksh Nimavat](https://github.com/dakshn15)

</div>
