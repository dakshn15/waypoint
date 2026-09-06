import { prisma } from "@/lib/db";

const DEFAULT_COMMISSION_RATE = 0.10;

/**
 * Get the effective commission rate for an agency.
 * Priority: agency-specific override → platform settings → hardcoded default.
 */
export async function getCommissionRate(agencyId?: string | null): Promise<number> {
  try {
    const db = prisma as any;

    // 1. Check agency-specific override
    if (agencyId && db.agency) {
      const agency = await db.agency.findUnique({
        where: { id: agencyId },
      });
      if (agency?.commissionRate !== null && agency?.commissionRate !== undefined) {
        return Number(agency.commissionRate);
      }
    }

    // 2. Fall back to platform settings
    if (db.platformSettings) {
      const settings = await db.platformSettings.findUnique({
        where: { id: "global" },
      });

      if (settings?.commissionRate !== null && settings?.commissionRate !== undefined) {
        return Number(settings.commissionRate);
      }
    }
  } catch (e) {
    console.error("Error fetching commission rate, using default:", e);
  }

  // 3. Fallback default
  return DEFAULT_COMMISSION_RATE;
}

/**
 * Get full platform settings. Returns defaults if missing or initializing.
 */
export async function getPlatformSettings() {
  const defaultSettings = {
    commissionRate: 0.10,
    minPayoutAmount: 1000,
    payoutHoldDays: 7,
    platformName: "Waypoint",
    supportEmail: "support@waypoint.com",
  };

  try {
    const db = prisma as any;
    if (!db.platformSettings) {
      return defaultSettings;
    }

    let settings = await db.platformSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await db.platformSettings.create({
        data: {
          id: "global",
          commissionRate: 0.10,
          minPayoutAmount: 1000,
          payoutHoldDays: 7,
        },
      });
    }

    return {
      commissionRate: Number(settings.commissionRate ?? 0.10),
      minPayoutAmount: Number(settings.minPayoutAmount ?? 1000),
      payoutHoldDays: Number(settings.payoutHoldDays ?? 7),
      platformName: settings.platformName || "Waypoint",
      supportEmail: settings.supportEmail || "support@waypoint.com",
    };
  } catch (e) {
    console.error("Error fetching platform settings, using defaults:", e);
    return defaultSettings;
  }
}
