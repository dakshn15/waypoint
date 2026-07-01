# Waypoint ✈️

Waypoint is a premium, AI-powered travel planning and booking platform. It connects travelers with travel agencies, provides an automated AI Trip Builder, and includes administration panels for agencies, staff members, and system administrators.

Designed with a modern, glassmorphic UI/UX and dark mode support, Waypoint streamlines travel operations, partnership management, and itinerary planning in a single unified dashboard.

---

## 🌟 Key Features

### 👤 Traveler Experience
*   **AI-Powered Trip Builder**: Generates personalized, day-by-day itineraries using Gemini AI based on destination, duration, budget, group style, and preferences.
*   **Traveler Dashboard**: A unified control center displaying upcoming bookings, generated trips, active notifications, and saved packages.
*   **Interactive Trip Planner**: Fully interactive map visualizations using Leaflet for day-by-day trip locations.
*   **Seamless Booking & Payments**: Clean reservation checkouts with multi-traveler detail forms, payment confirmation, and status indicators.

### 🏢 Travel Agency Console
*   **Package Designer**: Create, draft, publish, and manage multi-day travel packages with custom base prices, currencies, fixed departure dates, and detailed destination pins.
*   **Staff Administration**: Invite new staff members, toggle status, delete accounts, and edit roles (Manager, Agent, Support) live.
*   **Vendor Partnerships Hub**: Add and manage third-party service partners (Hotels, Transport, Restaurants, Activities, Guides) with ratings and categories.
*   **Bookings Tracker**: Overview of all client reservations, payment confirmations, and status modifiers.

### 👑 System Admin Dashboard
*   **Platform Overview**: High-level metrics showing total bookings, user accounts, active agencies, and monthly revenue.
*   **User Directory**: Role modification (Traveler, Agency, Staff, Admin) and platform-wide user control.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router & Turbopack compiler)
*   **Database & ORM**: Prisma with PostgreSQL (compatible with SQLite fallback)
*   **Authentication**: Better Auth (supporting credentials, security session polyfills, and Google OAuth)
*   **Styling**: Tailwind CSS & Vanilla CSS (with glassmorphism, responsive menus, and micro-animations)
*   **Visualizations**: Recharts (fully customized dark-mode tooltips) & Leaflet maps
*   **AI Engine**: Google Generative AI (Gemini SDK)

---

## 🚀 Getting Started

### 📋 Prerequisites
*   Node.js (v20+ recommended)
*   NPM or Yarn
*   A database connection (PostgreSQL database, or edit `schema.prisma` for local SQLite development)

### ⚙️ Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/dakshn15/waypoint.git
    cd waypoint
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory based on `.env.example`:
    ```env
    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/waypoint"

    # Better Auth Configuration
    BETTER_AUTH_SECRET="your-better-auth-secret-key"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"

    # Gemini AI Configuration
    GEMINI_API_KEY="your-google-gemini-api-key"

    # OAuth Providers (Optional)
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"
    ```

4.  **Database Migration & Setup**:
    Sync the Prisma schema with your database and run the seeds to populate demo accounts, packages, and bookings:
    ```bash
    npx prisma db push
    npx prisma db seed
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Seeded Accounts

Running `npx prisma db seed` creates the following demo accounts (password: `password123`):

| Role | Email | Description |
| :--- | :--- | :--- |
| **Admin** | `admin@waypoint.dev` | Full access to user management, roles, and statistics. |
| **Agency** | `agency@waypoint.dev` | Owns the demo agency ("Wanderlust Adventures") and can create packages, staff, and vendors. |
| **Staff** | `staff@waypoint.dev` | Agency staff agent; manages bookings for Wanderlust Adventures. |
| **Traveler** | `traveler@waypoint.dev` | Client/Traveler account; can book packages, builder trips, and view reservations. |

---

## 📂 Core Project Structure

```text
├── app/                  # Next.js App Router routes & layouts
│   ├── (auth)/           # Authentication pages (login, registration)
│   ├── actions/          # Next.js Server Actions (packages, staff, vendors)
│   ├── api/              # API endpoints (auth, notifications, payments)
│   ├── dashboard/        # Role-based dashboards (admin, agency, traveler, staff)
│   ├── packages/         # Public package directories and detailed views
│   └── trip-builder/     # Interactive AI trip builder workspace
├── components/           # Reusable UI Components
├── constants/            # Layout navigation links and configurations
├── lib/                  # Helper utilities (auth, db connection, storage polyfills)
├── prisma/               # Schema definition and database seed script
└── public/               # Static assets & graphics
```

---

## 🔒 Security & Sandboxing Polyfills
This project includes a built-in Client-Side Storage Polyfill ([storage-polyfill.ts](lib/storage-polyfill.ts)) imported at the entrypoint of the root layout. It detects if browser privacy options or third-party iframe sandboxing block direct access to `localStorage` or `sessionStorage`, and automatically binds in-memory fallbacks to prevent authentication libraries or theme providers from throwing `SecurityError` exceptions.
