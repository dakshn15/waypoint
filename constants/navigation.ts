export const NAV_ITEMS = {
  TRAVELER: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "My Trips", href: "/dashboard/trips", icon: "Map" },
    { title: "Bookings", href: "/dashboard/bookings", icon: "CalendarCheck" },
    { title: "Favorites", href: "/dashboard/favorites", icon: "Heart" },
    { title: "AI Trip Builder", href: "/trip-builder", icon: "Sparkles" },
    { title: "Profile", href: "/dashboard/profile", icon: "User" },
  ],
  AGENCY: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Packages", href: "/dashboard/packages", icon: "Package" },
    { title: "Bookings", href: "/dashboard/bookings", icon: "CalendarCheck" },
    { title: "Earnings & Payouts", href: "/dashboard/payouts", icon: "Wallet" },
    { title: "Tasks", href: "/dashboard/tasks", icon: "ListTodo" },
    { title: "Travelers", href: "/dashboard/travelers", icon: "Users" },
    { title: "Staff", href: "/dashboard/staff", icon: "UserCog" },
    { title: "Vendors", href: "/dashboard/vendors", icon: "Handshake" },
    { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
  ],
  STAFF: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Bookings", href: "/dashboard/bookings", icon: "CalendarCheck" },
    { title: "Tasks", href: "/dashboard/tasks", icon: "ListTodo" },
    { title: "Profile", href: "/dashboard/profile", icon: "User" },
  ],
  ADMIN: [
    { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { title: "Users", href: "/dashboard/users", icon: "Users" },
    { title: "Agencies", href: "/dashboard/agencies", icon: "Building2" },
    { title: "Bookings", href: "/dashboard/bookings", icon: "CalendarCheck" },
    { title: "Payments", href: "/dashboard/payments", icon: "DollarSign" },
    { title: "Payouts", href: "/dashboard/payouts", icon: "Wallet" },
    { title: "Audit Logs", href: "/dashboard/audit-logs", icon: "ShieldCheck" },
    { title: "Settings", href: "/dashboard/settings", icon: "Settings" },
  ],
} as const;

export type Role = keyof typeof NAV_ITEMS;
