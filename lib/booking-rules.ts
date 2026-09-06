import type { BookingStatus } from "@prisma/client";

const bookingTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["COMPLETED", "CANCELLED", "REFUNDED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return bookingTransitions[from].includes(to);
}

export function canCancelBooking(status: BookingStatus) {
  return bookingTransitions[status].includes("CANCELLED");
}
