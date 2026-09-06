import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { verifyRazorpayPayment } from "@/lib/payments";
import { sendEmail, bookingConfirmationEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay verification details" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { package: true, user: true },
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

    const payment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        gateway: "razorpay",
        gatewayId: razorpay_order_id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      select: { id: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment session not found for this booking." }, { status: 409 });
    }

    const isSuccess = verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isSuccess) {
      // Update Booking & Payment status
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            paidAmount: booking.totalAmount,
          },
        }),
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            providerPaymentId: razorpay_payment_id,
            gatewayData: { razorpay_order_id, razorpay_payment_id, razorpay_signature } as any,
          },
        }),
      ]);

      // Send confirmation email
      try {
        const emailTemplate = bookingConfirmationEmail({
          userName: booking.user.name,
          bookingNumber: booking.bookingNumber,
          packageTitle: booking.package?.title || "Custom AI Trip",
          travelDate: new Date(booking.travelDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          totalAmount: formatCurrency(Number(booking.totalAmount), booking.currency),
        });

        await sendEmail({
          to: booking.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      } catch (emailErr) {
        console.error("[VERIFY_PAYMENT_EMAIL_ERROR]", emailErr);
      }

      return NextResponse.json({ success: true });
    } else {
      // Mark Payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json({ success: false, error: "Payment verification failed" });
    }
  } catch (error: any) {
    console.error("[VERIFY_PAYMENT_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
