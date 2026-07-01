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
    console.log("[EMAIL] SMTP not configured, skipping email to:", options.to);
    console.log("[EMAIL] Subject:", options.subject);
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
        <div style="background: linear-gradient(135deg, #0B1426, #0EA5E9); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">✈️ Waypoint</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your journey begins</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0B1426; margin: 0 0 8px; font-size: 22px;">Booking Confirmed! 🎉</h2>
          <p style="color: #71717a; font-size: 15px; line-height: 1.6;">
            Hi ${data.userName}, your booking has been confirmed. Here are the details:
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px;">Booking ID</td>
                <td style="color: #0B1426; padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${data.bookingNumber}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px;">Package</td>
                <td style="color: #0B1426; padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${data.packageTitle}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px;">Travel Date</td>
                <td style="color: #0B1426; padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${data.travelDate}</td>
              </tr>
              <tr>
                <td style="color: #71717a; padding: 6px 0; font-size: 14px; border-top: 1px solid #e4e4e7; padding-top: 12px;">Total Amount</td>
                <td style="color: #0EA5E9; padding: 6px 0; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #e4e4e7; padding-top: 12px;">${data.totalAmount}</td>
              </tr>
            </table>
          </div>
          <p style="color: #71717a; font-size: 13px; line-height: 1.6;">
            You can view your booking details anytime in your <a href="${process.env.BETTER_AUTH_URL}/dashboard/bookings" style="color: #0EA5E9; text-decoration: none;">Waypoint Dashboard</a>.
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
        <div style="background: linear-gradient(135deg, #0B1426, #0EA5E9); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">✨ Waypoint AI</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Trip plan generated</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #0B1426; margin: 0 0 8px; font-size: 22px;">Your Trip Plan is Ready! 🌍</h2>
          <p style="color: #71717a; font-size: 15px; line-height: 1.6;">
            Hi ${data.userName}, your AI-crafted travel plan for <strong>${data.destination}</strong> is ready to explore.
          </p>
          <div style="background: linear-gradient(135deg, rgba(14,165,233,0.1), rgba(11,20,38,0.05)); border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center;">
            <h3 style="color: #0B1426; margin: 0 0 12px; font-size: 18px;">${data.tripTitle}</h3>
            <a href="${data.tripUrl}" style="display: inline-block; background: linear-gradient(135deg, #0EA5E9, #0B1426); color: white; text-decoration: none; padding: 12px 28px; border-radius: 99px; font-size: 14px; font-weight: 600;">
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
