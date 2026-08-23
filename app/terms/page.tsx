import { FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By creating a traveler account, registering as a local travel agency, or using any of our itinerary generation tools on Waypoint, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the platform.`,
  },
  {
    title: "2. User Accounts & Registration",
    content: "To access features like booking packages, managing traveler profiles, or generating plans with the AI Trip Builder, you must create a Waypoint account. You are responsible for safeguarding your credentials.",
    list: [
      "You must provide accurate and complete registration information.",
      "Agencies listing travel packages must verify their company profile and maintain accurate pricing.",
      "Traveler profiles are private but must contain valid contact information to confirm bookings successfully.",
    ],
  },
  {
    title: "3. Bookings, Payments, & Cancellations",
    content: "Waypoint acts as a facilitator connecting travelers with registered local agencies.",
    list: [
      "All package prices are denoted and processed in Indian Rupees (INR).",
      "Travelers can request cancellations for bookings directly from their user dashboard. Refund processes are handled according to the specific tour agency's cancellation policy.",
      "Agencies have the right to approve, reject, or mark bookings as completed or cancelled depending on tour logistics.",
    ],
  },
  {
    title: "4. AI Trip Planning Tool & Use of Gemini API",
    content: `Our AI Trip Planner utilizes large language models (including Google Gemini API) to generate mock and live travel itineraries. While we strive for accurate itinerary estimates, activities, routes, and recommendations, AI outputs are for guidance and informational purposes only. Waypoint does not guarantee the availability or feasibility of any generated trip plans, and travelers should verify specific local details (such as operating hours or safety notices) independently.`,
  },
  {
    title: "5. Limitation of Liability",
    content: `Waypoint and its affiliates will not be liable for any damages, injury, or loss arising from your travel arrangements, agency service quality, or itinerary changes. All travels booked or planned through the site are undertaken at the traveler's own discretion and risk.`,
  },
];

export default async function TermsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9] text-slate-900 font-sans">
      <SiteHeader userSession={session} />

      <main className="flex-grow">
        {/* ═══════════════ HERO SECTION ═══════════════ */}
        <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 lg:pb-16 overflow-hidden bg-gradient-to-b from-[#FAFAF9] via-[#F6F3F0] to-[#FAFAF9] border-b border-slate-200/60">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-secondary/6 rounded-full blur-[120px] pointer-events-none" />

          {/* Subtle Dot Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.35] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #CBD5E1 0.8px, transparent 0.8px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Centered Hero Content */}
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm text-xs font-bold text-slate-600 uppercase tracking-widest md:mb-6 mb-4">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Legal
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-slate-900 font-display mb-4">
              Terms of{" "}
              <span className="text-primary">Service</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
              The rules and guidelines that govern your use of the Waypoint platform.
            </p>

            {/* Last updated */}
            <p className="text-xs text-slate-400 font-medium mt-4">
              Last updated: June 21, 2026
            </p>
          </div>
        </section>

        {/* ═══════════════ CONTENT SECTIONS ═══════════════ */}
        <section className="lg:py-20 py-12">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6">
            {/* Back Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-8 group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((s, i) => (
                <section
                  key={i}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 lg:p-8"
                >
                  <h2 className="text-base sm:text-lg font-extrabold text-secondary mb-3">{s.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.content}</p>
                  {s.list && (
                    <ul className="mt-4 space-y-2.5">
                      {s.list.map((item, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* Contact Note */}
            <div className="mt-10 bg-primary/5 border border-primary/10 rounded-xl p-5 sm:p-6 text-center">
              <p className="text-sm text-slate-600">
                Have questions about our terms?{" "}
                <Link href="/contact" className="font-bold text-primary hover:underline underline-offset-2">
                  Contact our team →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
