import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RazorpayEvent = {
  event?: string;
  payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } };
};

function signaturesMatch(expected: string, received: string | null) {
  if (!received) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function reserveEvent(gateway: string, providerEventId: string, eventType: string) {
  try {
    await prisma.paymentEvent.create({ data: { gateway, providerEventId, eventType } });
    return true;
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return false;
    throw error;
  }
}

async function completePayment(paymentId: string, providerPaymentId: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
    if (!payment || payment.status === "COMPLETED") return;

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", providerPaymentId },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED", paidAmount: payment.booking.totalAmount },
    });
  });
}

async function failPayment(paymentId: string) {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: { in: ["PENDING", "PROCESSING"] } },
    data: { status: "FAILED" },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await context.params;
  const rawBody = await request.text();

  try {
    if (gateway !== "razorpay") {
      return NextResponse.json({ error: "Unsupported payment gateway" }, { status: 404 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!signaturesMatch(signature, request.headers.get("x-razorpay-signature"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as RazorpayEvent;
    const entity = event.payload?.payment?.entity;
    if (!event.event || !entity?.id || !entity.order_id) {
      return NextResponse.json({ error: "Unsupported event payload" }, { status: 400 });
    }
    const eventId = request.headers.get("x-razorpay-event-id") || `${event.event}:${entity.id}`;
    if (!(await reserveEvent("razorpay", eventId, event.event))) return NextResponse.json({ received: true });

    const payment = await prisma.payment.findFirst({
      where: { gateway: "razorpay", gatewayId: entity.order_id },
      select: { id: true },
    });
    if (!payment) return NextResponse.json({ received: true });

    if (event.event === "payment.captured") await completePayment(payment.id, entity.id);
    if (event.event === "payment.failed") await failPayment(payment.id);
    await prisma.paymentEvent.update({ where: { gateway_providerEventId: { gateway: "razorpay", providerEventId: eventId } }, data: { processedAt: new Date() } });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYMENT_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
