import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  // Skip if SMTP not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log("=================================================");
    console.log("[EMAIL] SMTP not configured, outputting email content locally:");
    console.log("[EMAIL] To:", options.to);
    console.log("[EMAIL] Subject:", options.subject);
    console.log("=================================================");
    return null;
  }

  const info = await transporter.sendMail({
    from: `"Waypoint" <${process.env.FROM_EMAIL || "noreply@waypoint.dev"}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  return info;
}

// Pre-built email templates
export function passwordResetEmail(data: { userName?: string; resetUrl: string }) {
  return {
    subject: "Reset your Waypoint password",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7;">
        <div style="background: #1A3B5A; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Way<span style="color:#E46F44;">point</span></h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1A3B5A; margin: 0 0 12px; font-size: 22px;">Need to reset your password?</h2>
          <p style="color: #71717a; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hi ${data.userName || "there"}, we received a request to reset your Waypoint account password. Click the button below to choose a new password.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${data.resetUrl}" style="display: inline-block; background: #E46F44; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(228,111,68,0.3);">
              Reset Password →
            </a>
          </div>
          <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email. This link will expire shortly.
          </p>
        </div>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Waypoint. AI-Powered Travel Planning.
          </p>
        </div>
      </div>
    `,
  };
}

export function bookingConfirmationEmail(data: {
  userName: string;
  bookingNumber: string;
  packageTitle: string;
  travelDate: string;
  totalAmount: string;
}) {
  return {
    subject: `Booking Confirmed – ${data.packageTitle} | Waypoint`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7;">
        <div style="background: #1A3B5A; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Way<span style="color:#E46F44;">point</span></h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your journey begins</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1A3B5A; margin: 0 0 8px; font-size: 22px;">Booking Confirmed! 🎉</h2>
          <p style="color: #71717a; font-size: 15px; line-height: 1.6;">
            Hi ${data.userName}, your booking has been confirmed. Here are the details:
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px;">Booking ID</td>
                <td style="color: #1A3B5A; padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${data.bookingNumber}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px;">Package</td>
                <td style="color: #1A3B5A; padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${data.packageTitle}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px;">Travel Date</td>
                <td style="color: #1A3B5A; padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${data.travelDate}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px; border-top: 1px solid #e4e4e7; padding-top: 12px;">Total Amount</td>
                <td style="color: #E46F44; padding: 6px 0; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #e4e4e7; padding-top: 12px;">${data.totalAmount}</td>
              </tr>
            </table>
          </div>
          <p style="color: #71717a; font-size: 13px; line-height: 1.6;">
            You can view your booking details anytime in your <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/bookings" style="color: #E46F44; text-decoration: none;">Waypoint Dashboard</a>.
          </p>
        </div>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Waypoint. AI-Powered Travel Planning.
          </p>
        </div>
      </div>
    `,
  };
}

export function tripGeneratedEmail(data: {
  userName: string;
  tripTitle: string;
  destination: string;
  tripUrl: string;
}) {
  return {
    subject: `Your AI Trip Plan is Ready – ${data.destination} | Waypoint`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7;">
        <div style="background: #1A3B5A; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Way<span style="color:#E46F44;">point</span> AI</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Trip plan generated</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1A3B5A; margin: 0 0 8px; font-size: 22px;">Your Trip Plan is Ready! 🌍</h2>
          <p style="color: #71717a; font-size: 15px; line-height: 1.6;">
            Hi ${data.userName}, your AI-crafted travel plan for <strong>${data.destination}</strong> is ready to explore.
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
            <h3 style="color: #1A3B5A; margin: 0 0 12px; font-size: 18px;">${data.tripTitle}</h3>
            <a href="${data.tripUrl}" style="display: inline-block; background: #E46F44; color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;">
              View Full Itinerary →
            </a>
          </div>
        </div>
        <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Waypoint. AI-Powered Travel Planning.
          </p>
        </div>
      </div>
    `,
  };
}
