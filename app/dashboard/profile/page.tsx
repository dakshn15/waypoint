import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileTabsClient from "./profile-tabs-client";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [profile, tripsCount, bookingsCount] = await Promise.all([
    prisma.travelerProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.trip.count({ where: { userId: session.user.id } }),
    prisma.booking.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-display">
          Profile Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Manage your personal details, traveler credentials, and security settings.
        </p>
      </div>

      <ProfileTabsClient
        user={session.user}
        initialProfile={profile}
        tripsCount={tripsCount}
        bookingsCount={bookingsCount}
      />
    </div>
  );
}
