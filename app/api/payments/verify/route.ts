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
    const { gateway, bookingId } = body;

    if (!bookingId || !gateway) {
      return NextResponse.json(
        { error: "Booking ID and gateway are required" },
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

    let isSuccess = false;
    let gatewayPaymentId = "";
    let rawData = {};

    if (gateway === "razorpay") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Missing Razorpay details" },
          { status: 400 }
        );
      }

      isSuccess = verifyRazorpayPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      gatewayPaymentId = razorpay_payment_id;
      rawData = { razorpay_order_id, razorpay_payment_id, razorpay_signature };

    } else if (gateway === "stripe") {
      const { sessionId } = body;
      if (!sessionId) {
        return NextResponse.json(
          { error: "Missing Stripe sessionId" },
          { status: 400 }
        );
      }

      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || "");
      const stripeSession = await stripeClient.checkout.sessions.retrieve(sessionId);

      isSuccess = stripeSession.payment_status === "paid";
      gatewayPaymentId = stripeSession.payment_intent as string || sessionId;
      rawData = stripeSession;
    } else {
      return NextResponse.json(
        { error: "Unsupported gateway" },
        { status: 400 }
      );
    }

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
        prisma.payment.updateMany({
          where: {
            bookingId: booking.id,
            gateway,
          },
          data: {
            status: "COMPLETED",
            gatewayId: gatewayPaymentId,
            gatewayData: rawData as any,
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
      await prisma.payment.updateMany({
        where: {
          bookingId: booking.id,
          gateway,
        },
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
