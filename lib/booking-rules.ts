import type { BookingStatus } from "@prisma/client";

const bookingTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "COMPLETED", "PENDING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["CONFIRMED", "COMPLETED", "CANCELLED", "REFUNDED"],
  COMPLETED: ["CONFIRMED", "PROCESSING", "REFUNDED"],
  CANCELLED: ["CONFIRMED", "PENDING", "REFUNDED"],
  REFUNDED: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return bookingTransitions[from]?.includes(to) ?? false;
}

export function canCancelBooking(status: BookingStatus) {
  return bookingTransitions[status]?.includes("CANCELLED") ?? false;
}
