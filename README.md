

<h1 align="center">Waypoint</h1>

<p align="center">
  <strong>AI-powered multi-tenant travel platform for agencies, travelers, and administrators.</strong>
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## Overview

Waypoint is a full-stack SaaS platform that connects travelers with travel agencies through an AI-powered trip builder, real-time booking management, and a multi-tenant agency console. Built with Next.js 16, Prisma, and the Gemini AI SDK, it features role-based dashboards, Razorpay payment integration, a commission & payout ledger, and a modern glassmorphic UI with dark mode support.

The platform supports four distinct user roles — **Traveler**, **Agency**, **Staff**, and **Admin** — each with purpose-built dashboards and granular permissions enforced at the server action level.

---

## ✨ Key Features

### 🤖 AI Trip Builder

- Generate personalized, day-by-day itineraries powered by **Google Gemini AI**
- Configure destination, travel dates, budget, group size, travel style (Budget → Luxury), and interests
- AI produces structured itineraries with activities, hotels, transport, and a full cost breakdown
- Interactive **Leaflet** map visualization for each day's locations
- Save, edit, and book generated trips directly

### 👤 Traveler Experience

- Browse and search published travel packages with filters for duration, price, and difficulty
- View detailed package pages with day-by-day itineraries, inclusions/exclusions, and reviews
- **Multi-traveler booking flow** with passenger details, special requests, and date selection
- Payment processing via **Razorpay** (UPI, Card, Net Banking, Wallet)
- Unified dashboard: upcoming trips, booking history, AI-generated trips, favorites, and notifications
- Profile management with passport, nationality, emergency contacts, and travel preferences

### 🏢 Agency Console

- **Package Designer**: Create multi-day packages with destinations (geocoded pins), pricing, departure dates, itineraries with hotels/transport/activities, inclusions, exclusions, and image galleries. Manage draft → published → archived lifecycle
- **Staff Management**: Invite team members, assign roles (**Manager**, **Agent**, **Support**), toggle active status, and revoke access
- **Vendor Hub**: Register and manage third-party partners (Hotels, Transport, Guides, Activities, Restaurants) with contact info, ratings, and categories
- **Booking Tracker**: View all client reservations, confirm payments, and update booking statuses
- **Task Board**: Create, assign, and track operational tasks with priority levels and due dates
- **Analytics Dashboard**: Revenue charts, booking trends, and performance metrics via **Recharts**
- **Payout Management**: View commission deductions, settlement history, and bank account configuration

### 👑 Platform Admin

- **System Overview**: Platform-wide metrics — total bookings, active users, agencies, and monthly revenue
- **User Directory**: Search, filter, and modify user roles across the entire platform
- **Agency Oversight**: View all registered agencies, verification status, and performance data
- **Platform Settings**: Configure global commission rates, minimum payout thresholds, hold periods, and support contacts
- **Audit Trail**: Timestamped logs of every administrative action with actor, resource, before/after snapshots

### 🔔 Notifications & Email

- Real-time in-app notification center with categorized alerts (Booking, Payment, Trip, System, Promotion)
- Transactional email delivery via **Nodemailer/SMTP** for booking confirmations, payment receipts, and status updates

---

## 🛡️ Security & Authorization

| Layer | Implementation |
|:---|:---|
| **Authentication** | Better Auth with credential + Google OAuth providers, session management, and email verification |
| **Role-Based Access** | Four roles (`TRAVELER`, `AGENCY`, `STAFF`, `ADMIN`) enforced in every Server Action and API route |
| **Agency Scoping** | Multi-tenant data isolation — staff and agencies only access their own data; ADMIN has platform-wide bypass |
| **Server Action Guards** | Ownership verification on every mutation — create, update, and delete operations check `agencyId` ownership before executing |
| **Storage Polyfill** | Client-side `localStorage`/`sessionStorage` fallback for sandboxed iframes and strict privacy modes |
| **Payment Idempotency** | `PaymentEvent` model prevents duplicate webhook processing with gateway + event ID deduplication |
| **Audit Logging** | All administrative mutations recorded with actor, action, resource type, and before/after snapshots |

---

## 🛠️ Tech Stack

| Category | Technology |
|:---|:---|
| **Framework** | [Next.js 16](https://nextjs.org/) — App Router, Server Actions, Turbopack |
| **Language** | TypeScript 5 (strict mode) |
| **Database** | PostgreSQL 16 via [Prisma ORM](https://prisma.io/) |
| **Authentication** | [Better Auth](https://better-auth.com/) — Credentials + Google OAuth |
| **AI Engine** | [Google Generative AI SDK](https://ai.google.dev/) (Gemini) |
| **Payments** | [Razorpay](https://razorpay.com/) — UPI, Card, Net Banking, Wallet |
| **Styling** | Tailwind CSS 4 + Vanilla CSS — Glassmorphism, dark mode, micro-animations |
| **UI Components** | [Base UI](https://base-ui.com/), [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.dev/) toasts |
| **State** | [Zustand](https://zustand.docs.pmnd.rs/) + [TanStack Query](https://tanstack.com/query) |
| **Charts** | [Recharts](https://recharts.org/) — Custom dark-mode tooltips and responsive layouts |
| **Maps** | [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) |
| **Animations** | [Framer Motion](https://motion.dev/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| **Carousel** | [Swiper](https://swiperjs.com/) |
| **Email** | [Nodemailer](https://nodemailer.com/) + [React Email](https://react.email/) |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) |
| **Testing** | Node.js native test runner via [tsx](https://tsx.is/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** 16+ (or use the included Docker Compose)
- A [Google Gemini API key](https://aistudio.google.com/apikey) for the AI Trip Builder
- *(Optional)* Google OAuth credentials for social login
- *(Optional)* Razorpay API keys for payment processing

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

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🌱 Seed Data

Running `npx prisma db seed` populates a **fully showcase-ready demo database** with loginable accounts, packages, bookings, payments, and more.

### Demo Accounts

All accounts use password: **`password123`**

| Role | Email | Name | Description |
|:---|:---|:---|:---|
| **Admin** | `admin@waypoint.dev` | Daksh Nimavat | Platform administrator — full access to users, agencies, settings, and audit logs |
| **Agency** | `agency@waypoint.dev` | Wanderlust Travels | Agency owner — manages packages, staff, vendors, bookings, and payouts |
| **Staff** | `staff@waypoint.dev` | Ananya Desai | Agency staff (Manager) — handles tasks, bookings, and operations for Wanderlust |
| **Traveler** | `traveler@waypoint.dev` | Rahul Sharma | Demo traveler — has bookings, favorites, reviews, notifications, and a filled profile |

### Demo Data Inventory

| Data | Count | Details |
|:---|:---:|:---|
| **Packages** | 9 | 8 published + 1 draft (Andaman Island Getaway) |
| **Itineraries** | 6 days | Day-by-day plans with activities, hotels, and transport for Golden Triangle & Kerala |
| **Bookings** | 8 | Confirmed, Pending, Processing, Completed, and Cancelled statuses |
| **Payments** | 6 | UPI, Card, Net Banking, and Wallet via Razorpay |
| **Reviews** | 8 | Varied ratings (4–5 stars) with detailed comments per package |
| **Vendors** | 5 | Hotel, Transport, Guide, Activity, and Restaurant partners |
| **Tasks** | 4 | Completed, In Progress, and Todo with priorities |
| **Notifications** | 8 | Mix of read/unread: booking, payment, trip, system, and promotion |
| **Favorites** | 3 | Traveler's saved packages |
| **Audit Logs** | 3 | Agency verification, package publish, settings change |
| **Platform Settings** | ✓ | 10% commission, ₹500 min payout, 7-day hold |

### Packages

| Package | Duration | Price (₹) | Difficulty | Status |
|:---|:---:|:---:|:---|:---|
| Golden Triangle Tour | 7 days | 24,999 | Easy | Published |
| Kerala Backwaters Bliss | 5 days | 18,999 | Easy | Published |
| Himalayan Adventure | 10 days | 35,999 | Challenging | Published |
| Goa Beach Paradise | 4 days | 12,999 | Easy | Published |
| Rajasthan Royal Heritage | 8 days | 29,999 | Moderate | Published |
| Northeast Explorer | 6 days | 22,999 | Moderate | Published |
| Varanasi Spiritual Ganges | 5 days | 16,999 | Easy | Published |
| Kashmir Valley & Gulmarg | 6 days | 27,999 | Moderate | Published |
| Andaman Island Getaway | 6 days | 32,999 | Moderate | **Draft** |


---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  React 19 · Framer Motion · Leaflet · Recharts · Swiper│
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │     Next.js 16 App Router   │
        │  ┌───────────┬────────────┐ │
        │  │  Server   │  API       │ │
        │  │  Actions  │  Routes    │ │
        │  └─────┬─────┴─────┬──────┘ │
        │        │           │        │
        │  ┌─────▼───────────▼──────┐ │
        │  │   lib/permissions.ts   │ │◄── Role-based access control
        │  │   (Authorization)      │ │
        │  └─────────┬─────────────┘ │
        └────────────┼───────────────┘
                     │
    ┌────────────────┼────────────────────┐
    │                │                    │
    ▼                ▼                    ▼
┌────────┐   ┌──────────────┐   ┌──────────────┐
│ Prisma │   │  Gemini AI   │   │   Razorpay   │
│  ORM   │   │    SDK       │   │  Gateway     │
└───┬────┘   └──────────────┘   └──────────────┘
    │
    ▼
┌────────────┐
│ PostgreSQL │
│    16      │
└────────────┘
```

### Data Flow

1. **Authentication** — Better Auth manages sessions, credentials, and OAuth flows. Sessions are stored server-side in PostgreSQL.
2. **Authorization** — Every Server Action calls `getUserAgencyAccess()` from `lib/permissions.ts` to resolve the caller's agency scope. Admin role bypasses tenant isolation.
3. **AI Trip Generation** — The `/api/trips` route streams structured prompts to Gemini, parses the response into `Trip`, `Itinerary`, `Activity`, `ItineraryHotel`, and `ItineraryTransport` records.
4. **Payments** — Razorpay orders are created server-side, completed client-side, then verified via webhook with idempotency guards (`PaymentEvent` model).
5. **Commission & Payouts** — Platform takes a configurable commission (default 10%, overridable per-agency). `AgencyPayout` records track settlement periods with gross/net amounts and bank transfer references.

---

## 📂 Project Structure

```
waypoint/
├── app/
│   ├── (auth)/              # Login & registration pages
│   ├── about/               # About page
│   ├── actions/             # Server Actions
│   │   ├── admin.ts         #   Platform admin mutations
│   │   ├── bookings.ts      #   Booking CRUD
│   │   ├── packages.ts      #   Package CRUD (with admin bypass)
│   │   ├── payout-actions.ts#   Commission & payout operations
│   │   ├── settings-actions.ts # Platform settings mutations
│   │   ├── staff.ts         #   Staff invite, role, status management
│   │   ├── tasks.ts         #   Task board CRUD
│   │   └── vendors.ts       #   Vendor partnership CRUD
│   ├── api/
│   │   ├── auth/            #   Better Auth API handler
│   │   ├── chat/            #   AI chat endpoint
│   │   ├── favorites/       #   Wishlist toggle
│   │   ├── notifications/   #   Notification polling
│   │   ├── payments/        #   Razorpay order creation & webhooks
│   │   └── trips/           #   AI trip generation endpoint
│   ├── contact/             # Contact page
│   ├── dashboard/
│   │   ├── page.tsx         # Unified dashboard (routes by role)
│   │   ├── agencies/        #   Admin: agency directory
│   │   ├── analytics/       #   Agency: revenue & booking charts
│   │   ├── audit-logs/      #   Admin: platform audit trail
│   │   ├── bookings/        #   Booking management
│   │   ├── favorites/       #   Traveler: saved packages
│   │   ├── packages/        #   Agency: package designer
│   │   ├── payments/        #   Payment history
│   │   ├── payouts/         #   Admin/Agency: commission & settlements
│   │   ├── profile/         #   User profile editor
│   │   ├── settings/        #   Admin: platform settings
│   │   ├── staff/           #   Agency: staff management
│   │   ├── tasks/           #   Agency: task board
│   │   ├── travelers/       #   Agency: traveler directory
│   │   ├── trips/           #   Traveler: AI-generated trips
│   │   ├── users/           #   Admin: user directory & role editor
│   │   └── vendors/         #   Agency: vendor partnerships
│   ├── packages/            # Public package listing & detail pages
│   ├── privacy/             # Privacy policy
│   ├── terms/               # Terms of service
│   └── trip-builder/        # Interactive AI trip builder workspace
├── components/
│   ├── layout/              # Header, sidebar, navigation
│   └── ui/                  # Reusable UI primitives
├── constants/               # Navigation links & layout config
├── hooks/                   # Custom React hooks (useMobile, etc.)
├── lib/
│   ├── ai.ts                # Gemini AI prompt engineering & parsing
│   ├── audit.ts             # Audit log helper
│   ├── auth.ts              # Better Auth server config
│   ├── auth-client.ts       # Better Auth client config
│   ├── booking-rules.ts     # Booking validation rules
│   ├── commission.ts        # Commission rate resolution & platform settings
│   ├── currency.ts          # Multi-currency formatting utilities
│   ├── db.ts                # Prisma client singleton
│   ├── email.ts             # Email templates & SMTP transport
│   ├── payments.ts          # Razorpay SDK initialization
│   ├── permissions.ts       # Central RBAC — getUserAgencyAccess()
│   ├── storage-polyfill.ts  # localStorage/sessionStorage fallback
│   ├── utils.ts             # General utilities (cn, slugify, etc.)
│   └── validation.ts        # Zod schemas for form validation
├── prisma/
│   ├── schema.prisma        # Database schema (25+ models, 15+ enums)
│   └── seed.ts              # Demo data seeder
├── public/                  # Static assets & images
├── tests/
│   ├── booking-rules.test.ts
│   └── currency.test.ts
├── docker-compose.yml       # PostgreSQL 16 dev container
└── package.json
```

---

## 🧪 Testing

```bash
npm test
```

Runs the test suite using Node.js native test runner via `tsx`:

- `tests/booking-rules.test.ts` — Booking validation logic
- `tests/currency.test.ts` — Multi-currency formatting utilities

---

## 📜 License

This project is not currently published under a specific license. All rights reserved.
