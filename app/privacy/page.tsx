import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function PrivacyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-zinc-950/30">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:text-[var(--waypoint-teal)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session?.user ? (
              <Link href="/dashboard">
                <Button className="bg-[var(--waypoint-teal)] hover:bg-[var(--waypoint-teal)]/90 text-white rounded-full px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto max-w-3xl px-4 py-16 space-y-8">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 21, 2026</p>
        </div>

        <Card className="glass-card border border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-8 space-y-6 prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1. Information We Collect</h2>
              <p>
                Waypoint collects personal information when you register, book a travel package, or plan an itinerary with our AI Trip Builder. This includes your name, email address, telephone contact details, travel interests, and traveler profiles (emergency contacts, passport information).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">2. How We Use Your Information</h2>
              <p>We leverage collected data to provide the following travel operations features:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and execute personalized day-by-day itineraries via our AI Planner.</li>
                <li>Coordinate booking confirmations, invoice creations, and vouchers between you and registered travel agencies.</li>
                <li>Verify billing transactions and send payment confirmations via our secure integrations (Stripe, Razorpay).</li>
                <li>Dispatch transactional emails (booking confirmations, payment success notifications).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">3. Data Integrity & Sharing</h2>
              <p>
                We do not sell or trade your personal information. To fulfill bookings, we share necessary traveler info (traveler list names, age) with the specific travel operator/agency managing the package. Billing information is processed directly by Stripe/Razorpay without staying on our local servers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">4. Your Privacy Choices</h2>
              <p>
                You can review, edit, or delete your traveler preferences, emergency contacts, or passport numbers at any time from your **Profile Dashboard**. To request permanent deletion of your entire account, please contact our support team at `support@waypoint.dev`.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
