"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getUserAgencyAccess } from "@/lib/permissions";
import { bookingStatusSchema, createBookingSchema } from "@/lib/validation";
import { canCancelBooking, canTransitionBooking } from "@/lib/booking-rules";

export async function createBooking(data: {
  packageId?: string;
  tripId?: string;
  travelDate: Date | string;
  returnDate?: Date | string;
  travelers: Array<{ name: string; age: number; document?: string }>;
  specialRequests?: string;
  // Retained for client compatibility but deliberately ignored. Package and
  // trip prices must always be calculated from trusted server-side records.
  totalAmount?: number;
  currency?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to book.");
  }

  if (session.user.role !== "TRAVELER") {
    throw new Error("Only traveler accounts can create bookings.");
  }

  const input = createBookingSchema.parse(data);

  let agencyId: string | null = null;
  let packageId: string | null = null;
  let tripId: string | null = null;
  let totalAmount: number;
  let currency: string;
  let returnDate = input.returnDate ?? null;

  if (input.packageId) {
    const pkg = await prisma.package.findUnique({
      where: { id: input.packageId },
      include: { agency: { select: { active: true, verified: true } } },
    });
    if (!pkg || pkg.status !== "PUBLISHED" || !pkg.agency.active || !pkg.agency.verified) {
      throw new Error("This package is not currently available for booking.");
    }
    if (pkg.availableFrom && input.travelDate < pkg.availableFrom) {
      throw new Error("The selected departure date is not available.");
    }
    if (pkg.availableTo && input.travelDate > pkg.availableTo) {
      throw new Error("The selected departure date is not available.");
    }
    if (pkg.departureDates.length > 0 && !pkg.departureDates.some((date) => date.toISOString().slice(0, 10) === input.travelDate.toISOString().slice(0, 10))) {
      throw new Error("The selected departure date is not available.");
    }
    if (pkg.maxGroupSize && input.travelers.length > pkg.maxGroupSize) {
      throw new Error("The number of travelers exceeds this package's group limit.");
    }
    agencyId = pkg.agencyId;
    packageId = pkg.id;
    totalAmount = Number(pkg.basePrice) * input.travelers.length;
    currency = pkg.currency;
  } else {
    const trip = await prisma.trip.findFirst({
      where: { id: input.tripId, userId: session.user.id },
    });
    if (!trip || !["GENERATED", "SAVED"].includes(trip.status)) {
      throw new Error("This custom trip is not available for booking.");
    }
    if (input.travelers.length !== trip.travelers) {
      throw new Error("Traveler count must match the saved custom trip.");
    }
    tripId = trip.id;
    totalAmount = Number(trip.budget);
    currency = trip.currency;
    returnDate = trip.endDate;
  }

  const booking = await prisma.$transaction(async (tx) => {
    if (packageId) {
      const pkg = await tx.package.findUnique({
        where: { id: packageId },
        select: { maxGroupSize: true },
      });
      if (!pkg) throw new Error("This package is no longer available for booking.");

      if (pkg.maxGroupSize) {
        const dayStart = new Date(input.travelDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
        const existingBookings = await tx.booking.findMany({
          where: {
            packageId,
            status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
            travelDate: { gte: dayStart, lt: dayEnd },
          },
          select: { travelers: true },
        });
        const reservedPlaces = existingBookings.reduce(
          (count, existing) => count + (Array.isArray(existing.travelers) ? existing.travelers.length : 0),
          0
        );
        if (reservedPlaces + input.travelers.length > pkg.maxGroupSize) {
          throw new Error("There are not enough places left for this departure date.");
        }
      }
    }

    return tx.booking.create({
      data: {
        userId: session.user.id,
        agencyId,
        packageId,
        tripId,
        status: "PENDING",
        travelers: input.travelers,
        specialRequests: input.specialRequests || null,
        totalAmount,
        currency,
        travelDate: input.travelDate,
        returnDate,
      },
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return booking;
}

export async function cancelBooking(bookingId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to perform this action.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!canCancelBooking(booking.status)) {
    throw new Error("This booking can no longer be cancelled.");
  }

  const role = (session.user as any).role || "TRAVELER";

  if (role === "TRAVELER" && booking.userId !== session.user.id) {
    throw new Error("Unauthorized to cancel this booking.");
  }

  if (role === "AGENCY" || role === "STAFF") {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || booking.agencyId !== access.agencyId) {
      throw new Error("Unauthorized to cancel this booking.");
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  // Notify traveler
  try {
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: "Booking Cancelled ❌",
        message: `Your booking (ID: ${bookingId.slice(-6)}) has been successfully cancelled.`,
        type: "BOOKING",
      },
    });
  } catch (err) {
    console.warn("Could not create notification:", err);
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return updated;
}

export async function updateBookingStatus(
  bookingId: string,
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "REFUNDED"
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to perform this action.");
  }

  const role = (session.user as any).role || "TRAVELER";

  if (role !== "ADMIN" && role !== "AGENCY" && role !== "STAFF") {
    throw new Error("Only agency personnel and admins can update booking status.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  const nextStatus = bookingStatusSchema.parse(status);
  if (!canTransitionBooking(booking.status, nextStatus)) {
    throw new Error(`Cannot change a ${booking.status.toLowerCase()} booking to ${nextStatus.toLowerCase()}.`);
  }

  if (role === "AGENCY" || role === "STAFF") {
    const access = await getUserAgencyAccess(session.user.id, session.user.role);
    if (!access || booking.agencyId !== access.agencyId) {
      throw new Error("Unauthorized to update this booking.");
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: nextStatus },
  });

  // Create traveler notification
  try {
    let title = "Booking Status Update 📋";
    let message = `Your booking (ID: ${bookingId.slice(-6)}) has been updated to ${nextStatus.toLowerCase()}.`;

    if (nextStatus === "CONFIRMED") {
      title = "Booking Confirmed! 🎉";
      message = `Great news! Your booking (ID: ${bookingId.slice(-6)}) has been confirmed by the agency.`;
    } else if (nextStatus === "CANCELLED") {
      title = "Booking Cancelled ❌";
      message = `Your booking (ID: ${bookingId.slice(-6)}) was cancelled.`;
    }

    await prisma.notification.create({
      data: {
        userId: updated.userId,
        title,
        message,
        type: "BOOKING",
      },
    });
  } catch (err) {
    console.warn("Could not create status notification:", err);
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return updated;
}
