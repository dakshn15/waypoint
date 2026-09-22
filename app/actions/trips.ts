"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteTrip(tripId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized. Please log in." };
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, userId: true, status: true },
    });

    if (!trip) {
      return { error: "Trip not found." };
    }

    // Only the trip owner can delete it
    if (trip.userId !== session.user.id) {
      return { error: "You are not authorized to delete this trip." };
    }

    // Don't allow deleting trips that are currently booked
    if (trip.status === "BOOKED") {
      return { error: "Cannot delete a trip that has an active booking. Cancel the booking first." };
    }

    // Check for any active bookings referencing this trip
    const activeBooking = await prisma.booking.findFirst({
      where: {
        tripId: trip.id,
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
      },
      select: { id: true },
    });

    if (activeBooking) {
      return { error: "Cannot delete this trip because it has an active booking." };
    }

    // Delete the trip — Prisma schema has onDelete: Cascade on all
    // child relations (Itinerary → Activity, ItineraryHotel, ItineraryTransport),
    // so they are automatically cleaned up.
    await prisma.trip.delete({
      where: { id: trip.id },
    });

    revalidatePath("/dashboard/trips");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_TRIP_ERROR]", error);
    return { error: error.message || "Failed to delete trip." };
  }
}
