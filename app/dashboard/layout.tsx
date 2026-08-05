import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NAV_ITEMS } from "@/constants/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Default to TRAVELER role if user role is not set in database
  const userRole = (session.user as { role?: string }).role || "TRAVELER";
  const navItems = NAV_ITEMS[userRole as keyof typeof NAV_ITEMS] || NAV_ITEMS.TRAVELER;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar
        navItems={[...navItems]}
        userName={session.user.name || "User"}
        userEmail={session.user.email || ""}
        userRole={userRole}
        userImage={session.user.image || null}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
