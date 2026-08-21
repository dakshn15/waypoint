import { Shield, ArrowLeft } from "lucide-react";
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

      <main className="flex-grow md:pt-36 pt-28 pb-20">
        <div className="container mx-auto max-w-3xl px-4">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-secondary mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-400">Last updated: June 21, 2026</p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((s, i) => (
              <section
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8"
              >
                <h2 className="text-base font-extrabold text-secondary mb-3">{s.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{s.content}</p>
                {s.list && (
                  <ul className="mt-3 space-y-2">
                    {s.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Contact Note */}
          <div className="mt-10 bg-secondary/5 border border-secondary/10 rounded-xl p-5 text-center">
            <p className="text-sm text-slate-600">
              Questions about your privacy?{" "}
              <Link href="/contact" className="font-bold text-primary hover:underline underline-offset-2">
                Contact our team →
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
