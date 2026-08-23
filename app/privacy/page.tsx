import { Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";

const sections = [
  {
    title: "1. Information We Collect",
    content: `Waypoint collects personal information when you register, book a travel package, or plan an itinerary with our AI Trip Builder. This includes your name, email address, telephone contact details, travel interests, and traveler profiles (emergency contacts, passport information).`,
  },
  {
    title: "2. How We Use Your Information",
    content: "We leverage collected data to provide the following travel operations features:",
    list: [
      "Create and execute personalized day-by-day itineraries via our AI Planner.",
      "Coordinate booking confirmations, invoice creations, and vouchers between you and registered travel agencies.",
      "Verify billing transactions and send payment confirmations via our secure integrations (Stripe, Razorpay).",
      "Dispatch transactional emails (booking confirmations, payment success notifications).",
    ],
  },
  {
    title: "3. Data Integrity & Sharing",
    content: `We do not sell or trade your personal information. To fulfill bookings, we share necessary traveler info (traveler list names, age) with the specific travel operator/agency managing the package. Billing information is processed directly by Stripe/Razorpay without staying on our local servers.`,
  },
  {
    title: "4. Your Privacy Choices",
    content: `You can review, edit, or delete your traveler preferences, emergency contacts, or passport numbers at any time from your Profile Dashboard. To request permanent deletion of your entire account, please contact our support team at support@waypoint.dev.`,
  },
];

export default async function PrivacyPage() {
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
              <Shield className="h-3.5 w-3.5 text-primary" />
              Legal
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-slate-900 font-display mb-4">
              Privacy{" "}
              <span className="text-primary">Policy</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
              How Waypoint collects, uses, and protects your personal data.
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
            <div className="mt-10 bg-secondary/5 border border-secondary/10 rounded-xl p-5 sm:p-6 text-center">
              <p className="text-sm text-slate-600">
                Questions about your privacy?{" "}
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
