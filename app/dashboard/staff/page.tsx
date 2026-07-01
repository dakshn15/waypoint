import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializePrisma } from "@/lib/utils";
import StaffClient from "./staff-client";

export default async function StaffPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        Please log in to manage staff.
      </div>
    );
  }

  const role = (session.user as any).role || "TRAVELER";
  if (role !== "AGENCY") {
    return (
      <div className="text-center text-muted-foreground p-12">
        This page is only available for agency administrators.
      </div>
    );
  }

  const agency = await prisma.agency.findUnique({
    where: { ownerId: session.user.id },
  });

  const staffMembers = agency
    ? await prisma.agencyStaff.findMany({
        where: { agencyId: agency.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="container mx-auto p-0">
      <StaffClient initialStaff={serializePrisma(staffMembers)} />
    </div>
  );
}
