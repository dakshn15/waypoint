import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import {
  createRazorpayOrder,
  isPaymentConfigured,
  toSmallestUnit,
} from "@/lib/payments";
import { paymentRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = paymentRequestSchema.parse(await req.json());

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

    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: "This booking can no longer be paid." }, { status: 409 });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { bookingId: booking.id, gateway: "razorpay", status: { in: ["PENDING", "PROCESSING"] } },
      select: { id: true },
    });
    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment session is already in progress for this booking." },
        { status: 409 }
      );
    }

    if (!isPaymentConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env" },
        { status: 503 }
      );
    }

    const amount = toSmallestUnit(Number(booking.totalAmount), booking.currency);

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
  } catch (error: any) {
    console.error("[PAYMENT_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
