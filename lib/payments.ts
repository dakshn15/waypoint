import Razorpay from "razorpay";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export interface CreateOrderParams {
  amount: number; // in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const order = await razorpay.orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes || {},
  });
  return order;
}

export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

// Stripe integration
export async function createStripeSession(params: {
  amount: number;
  currency: string;
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  // Dynamic import to avoid issues when Stripe is not configured
  const stripe = (await import("stripe")).default;
  const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || "");

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: "Waypoint Travel Booking",
            description: `Booking #${params.bookingId}`,
          },
          unit_amount: params.amount, // in smallest unit
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      bookingId: params.bookingId,
    },
  });

  return session;
}

// Helper to convert INR to paise (or any currency to smallest unit)
export function toSmallestUnit(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ["JPY", "KRW", "VND"];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function isPaymentConfigured(): {
  razorpay: boolean;
  stripe: boolean;
} {
  return {
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    stripe: !!process.env.STRIPE_SECRET_KEY,
  };
}
