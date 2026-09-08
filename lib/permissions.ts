import { prisma } from "@/lib/db";
import { StaffRole } from "@prisma/client";

export interface AgencyAccess {
  agencyId: string;
  isOwner: boolean;
  staffRole: StaffRole | null;
}

export async function getUserAgencyAccess(
  userId: string | null | undefined,
  userRole: string | null | undefined
): Promise<AgencyAccess | null> {
  if (!userId || !userRole) return null;

  if (userRole === "AGENCY" || userRole === "ADMIN") {
    const agency = await prisma.agency.findUnique({
      where: { ownerId: userId },
    });
    if (agency) {
      return {
        agencyId: agency.id,
        isOwner: true,
        staffRole: null,
      };
    }
  }

  if (userRole === "STAFF") {
    const staff = await prisma.agencyStaff.findUnique({
      where: { userId },
    });
    if (!staff || !staff.active) return null;
    return {
      agencyId: staff.agencyId,
      isOwner: false,
      staffRole: staff.role,
    };
  }

  return null;
}

