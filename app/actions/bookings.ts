"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createBooking(data: {
  packageId?: string;
  tripId?: string;
  travelDate: Date | string;
  returnDate?: Date | string;
  travelers: Array<{ name: string; age: number; document?: string }>;
  specialRequests?: string;
  totalAmount: number;
  currency: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("You must be logged in to book.");
  }

  // Find the agency associated with the package if packageId is provided
  let agencyId: string | null = null;
  if (data.packageId) {
    const pkg = await prisma.package.findUnique({
      where: { id: data.packageId },
      select: { agencyId: true },
    });
    if (pkg) {
      agencyId = pkg.agencyId;
    }
  }

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      agencyId,
      packageId: data.packageId || null,
      tripId: data.tripId || null,
      status: "PENDING",
      travelers: data.travelers,
      specialRequests: data.specialRequests || null,
      totalAmount: data.totalAmount,
      currency: data.currency,
      travelDate: new Date(data.travelDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : null,
    },
  });

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

  const role = (session.user as any).role || "TRAVELER";

  if (role === "TRAVELER" && booking.userId !== session.user.id) {
    throw new Error("Unauthorized to cancel this booking.");
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

  if (role !== "ADMIN" && role !== "AGENCY") {
    throw new Error("Only agencies and admins can update booking status.");
  }

  if (role === "AGENCY") {
    const agency = await prisma.agency.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!agency) {
      throw new Error("Agency profile not found.");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.agencyId !== agency.id) {
      throw new Error("Unauthorized to update this booking.");
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  // Create traveler notification
  try {
    let title = "Booking Status Update 📋";
    let message = `Your booking (ID: ${bookingId.slice(-6)}) has been updated to ${status.toLowerCase()}.`;

    if (status === "CONFIRMED") {
      title = "Booking Confirmed! 🎉";
      message = `Great news! Your booking (ID: ${bookingId.slice(-6)}) has been confirmed by the agency.`;
    } else if (status === "CANCELLED") {
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

