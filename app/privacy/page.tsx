import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function PrivacyPage() {
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
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 21, 2026</p>
        </div>

        <Card className="glass-card border border-slate-200">
          <CardContent className="p-8 space-y-6 max-w-none text-slate-600 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
              <p>
                Waypoint collects personal information when you register, book a travel package, or plan an itinerary with our AI Trip Builder. This includes your name, email address, telephone contact details, travel interests, and traveler profiles (emergency contacts, passport information).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
              <p>We leverage collected data to provide the following travel operations features:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and execute personalized day-by-day itineraries via our AI Planner.</li>
                <li>Coordinate booking confirmations, invoice creations, and vouchers between you and registered travel agencies.</li>
                <li>Verify billing transactions and send payment confirmations via our secure integrations (Stripe, Razorpay).</li>
                <li>Dispatch transactional emails (booking confirmations, payment success notifications).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Data Integrity & Sharing</h2>
              <p>
                We do not sell or trade your personal information. To fulfill bookings, we share necessary traveler info (traveler list names, age) with the specific travel operator/agency managing the package. Billing information is processed directly by Stripe/Razorpay without staying on our local servers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. Your Privacy Choices</h2>
              <p>
                You can review, edit, or delete your traveler preferences, emergency contacts, or passport numbers at any time from your **Profile Dashboard**. To request permanent deletion of your entire account, please contact our support team at `support@waypoint.dev`.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
