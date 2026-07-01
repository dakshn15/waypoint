import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import {
  createRazorpayOrder,
  createStripeSession,
  isPaymentConfigured,
  toSmallestUnit,
} from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, gateway } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const configured = isPaymentConfigured();
    const amount = toSmallestUnit(Number(booking.totalAmount), booking.currency);

    if (gateway === "razorpay") {
      if (!configured.razorpay) {
        return NextResponse.json(
          { error: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env" },
          { status: 503 }
        );
      }

      const order = await createRazorpayOrder({
        amount,
        currency: booking.currency,
        receipt: booking.bookingNumber,
        notes: {
          bookingId: booking.id,
          userId: session.user.id,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          currency: booking.currency,
          status: "PENDING",
          method: "UPI",
          gateway: "razorpay",
          gatewayId: order.id,
          gatewayData: order as any,
        },
      });

      return NextResponse.json({
        gateway: "razorpay",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    if (gateway === "stripe") {
      if (!configured.stripe) {
        return NextResponse.json(
          { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env" },
          { status: 503 }
        );
      }

      const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
      const stripeSession = await createStripeSession({
        amount,
        currency: booking.currency,
        bookingId: booking.id,
        successUrl: `${baseUrl}/dashboard/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}&bookingId=${booking.id}`,
        cancelUrl: `${baseUrl}/dashboard/bookings?payment=cancelled&bookingId=${booking.id}`,
      });

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          currency: booking.currency,
          status: "PENDING",
          method: "CARD",
          gateway: "stripe",
          gatewayId: stripeSession.id,
          gatewayData: { sessionId: stripeSession.id } as any,
        },
      });

      return NextResponse.json({
        gateway: "stripe",
        sessionUrl: stripeSession.url,
      });
    }

    return NextResponse.json(
      { error: "Invalid payment gateway. Use 'razorpay' or 'stripe'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[PAYMENT_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
