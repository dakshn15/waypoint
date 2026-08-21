import { FileText, ArrowLeft } from "lucide-react";
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
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-secondary mb-2">
              Terms of Service
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
          <div className="mt-10 bg-primary/5 border border-primary/10 rounded-xl p-5 text-center">
            <p className="text-sm text-slate-600">
              Have questions about our terms?{" "}
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
