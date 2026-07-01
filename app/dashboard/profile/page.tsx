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

  const profile = await prisma.travelerProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information, traveler credentials, and security preferences.
        </p>
      </div>

      <ProfileTabsClient user={session.user} initialProfile={profile} />
    </div>
  );
}

