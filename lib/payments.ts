import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";

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
  const body = orderId + "|" + paymentId;
  const expectedSignature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// Helper to convert INR to paise (or any currency to smallest unit)
export function toSmallestUnit(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ["JPY", "KRW", "VND"];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function isPaymentConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
