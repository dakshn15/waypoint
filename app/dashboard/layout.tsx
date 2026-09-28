import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NAV_ITEMS } from "@/constants/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/db";
import { getUserAgencyAccess } from "@/lib/permissions";
import { AlertTriangle } from "lucide-react";

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

  // Check if agency is suspended (for AGENCY/STAFF users)
  let isSuspended = false;
  let agencyName = "";
  if (userRole === "AGENCY" || userRole === "STAFF") {
    try {
      const access = await getUserAgencyAccess(session.user.id, userRole);
      if (access) {
        const agency = await prisma.agency.findUnique({
          where: { id: access.agencyId },
          select: { active: true, name: true },
        });
        if (agency && agency.active === false) {
          isSuspended = true;
          agencyName = agency.name;
        }
      }
    } catch {
      // Ignore errors in suspension check
    }
  }

  return (
    <DashboardShell
      navItems={[...navItems]}
      userName={session.user.name || "User"}
      userEmail={session.user.email || ""}
      userRole={userRole}
      userImage={session.user.image || null}
    >
      {isSuspended && (
        <div className="mb-4 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3.5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-amber-800">
                Agency Suspended
              </h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Your agency <strong>&quot;{agencyName}&quot;</strong> has been suspended by the platform administrator.
                During suspension, you cannot create or edit packages, accept new bookings, or request payouts.
                Please contact the admin at{" "}
                <a href="mailto:support@waypointtravel.in" className="underline font-semibold hover:text-amber-900">
                  support@waypointtravel.in
                </a>{" "}
                for more information.
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
