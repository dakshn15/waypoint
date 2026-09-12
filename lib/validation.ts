import { z } from "zod";

export const currencySchema = z.enum(["INR", "USD", "EUR", "GBP", "AED", "THB", "SGD"]);

export const travelerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  age: z.coerce.number().int().min(1).max(120),
  gender: z.string().trim().optional(),
  document: z.string().trim().max(200).optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().max(30).optional(),
});

export const createBookingSchema = z
  .object({
    packageId: z.string().cuid().optional(),
    tripId: z.string().cuid().optional(),
    travelDate: z.coerce.date(),
    returnDate: z.coerce.date().optional(),
    travelers: z.array(travelerSchema).min(1).max(10),
    specialRequests: z.string().trim().max(2_000).optional(),
  })
  .refine((value) => Boolean(value.packageId) !== Boolean(value.tripId), {
    message: "Choose either a package or a saved custom trip.",
    path: ["packageId"],
  })
  .refine((value) => !value.returnDate || value.returnDate >= value.travelDate, {
    message: "Return date cannot be before the travel date.",
    path: ["returnDate"],
  });

export const paymentRequestSchema = z.object({
  bookingId: z.string().cuid(),
  gateway: z.literal("razorpay"),
});

export const bookingStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]);

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]);
