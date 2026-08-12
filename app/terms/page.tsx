import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function TermsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9] text-slate-900 font-sans">
      <SiteHeader userSession={session} />

      {/* Main Content */}
      <main className="flex-grow container mx-auto max-w-3xl px-4 py-16 space-y-8 md:pt-36 pt-28">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 21, 2026</p>
        </div>

        <Card className="glass-card border border-slate-200">
          <CardContent className="p-8 space-y-6 max-w-none text-slate-600 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By creating a traveler account, registering as a local travel agency, or using any of our itinerary generation tools on Waypoint, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. User Accounts & Registration</h2>
              <p>
                To access features like booking packages, managing traveler profiles, or generating plans with the AI Trip Builder, you must create a Waypoint account. You are responsible for safeguarding your credentials.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>You must provide accurate and complete registration information.</li>
                <li>Agencies listing travel packages must verify their company profile and maintain accurate pricing.</li>
                <li>Traveler profiles are private but must contain valid contact information to confirm bookings successfully.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Bookings, Payments, & Cancellations</h2>
              <p>
                Waypoint acts as a facilitator connecting travelers with registered local agencies.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All package prices are denoted and processed in Indian Rupees (INR).</li>
                <li>Travelers can request cancellations for bookings directly from their user dashboard. Refund processes are handled according to the specific tour agency's cancelation policy.</li>
                <li>Agencies have the right to approve, reject, or mark bookings as completed or cancelled depending on tour logistics.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. AI Trip Planning Tool & Use of Gemini API</h2>
              <p>
                Our AI Trip Planner utilizes large language models (including Google Gemini API) to generate mock and live travel itineraries.
              </p>
              <p>
                While we strive for accurate itinerary estimates, activities, routes, and recommendations, AI outputs are for guidance and informational purposes only. Waypoint does not guarantee the availability or feasibility of any generated trip plans, and travelers should verify specific local details (such as operating hours or safety notices) independently.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
              <p>
                Waypoint and its affiliates will not be liable for any damages, injury, or loss arising from your travel arrangements, agency service quality, or itinerary changes. All travels booked or planned through the site are undertaken at the traveler's own discretion and risk.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
