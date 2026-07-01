import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  MapPin,
  Shield,
  Star,
  ArrowRight,
  Plane,
  Clock,
  Users,
  Globe,
  Zap,
  Heart,
  IndianRupee,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const FEATURES = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI Trip Builder",
    description:
      "Describe your dream trip and get a detailed day-by-day itinerary crafted by Gemini AI in seconds.",
    gradient: "from-[var(--waypoint-teal)] to-sky-400",
    shadow: "shadow-sky-500/20",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Curated Packages",
    description:
      "Browse expert-designed travel packages from verified agencies across India and worldwide.",
    gradient: "from-[var(--waypoint-amber)] to-orange-500",
    shadow: "shadow-amber-500/20",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Booking",
    description:
      "Book with confidence via Razorpay and Stripe. Real-time tracking, instant confirmations.",
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-500/20",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Multi-Currency",
    description:
      "View prices in INR, USD, EUR, GBP, and more. INR as base currency with live conversion.",
    gradient: "from-violet-500 to-purple-400",
    shadow: "shadow-violet-500/20",
  },
];

const STATS = [
  { value: "500+", label: "Destinations", icon: <MapPin className="h-4 w-4" /> },
  { value: "50+", label: "Agencies", icon: <Users className="h-4 w-4" /> },
  { value: "10K+", label: "Trips Created", icon: <Plane className="h-4 w-4" /> },
  { value: "4.9", label: "Avg Rating", icon: <Star className="h-4 w-4" /> },
];

const TESTIMONIALS = [
  {
    name: "Priya Mehta",
    role: "Solo Traveler",
    text: "Waypoint's AI planned my entire Rajasthan trip in 30 seconds. The itinerary was spot-on — every restaurant, every timing. Incredible!",
    rating: 5,
  },
  {
    name: "Arjun Kapoor",
    role: "Travel Blogger",
    text: "As someone who's traveled 40+ countries, I'm impressed by how accurate and detailed the AI suggestions are. This is the future of travel.",
    rating: 5,
  },
  {
    name: "Wanderlust Travels",
    role: "Travel Agency",
    text: "We onboarded our agency on Waypoint and saw a 3x increase in bookings within the first month. The platform is a game-changer.",
    rating: 5,
  },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b-0 border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--waypoint-teal)] to-[var(--waypoint-navy)] flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Waypoint
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/packages"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Packages
            </Link>
            <Link
              href="/trip-builder"
              className="text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span className="bg-gradient-to-r from-[var(--waypoint-amber)] to-orange-500 text-transparent bg-clip-text">
                AI Builder
              </span>
            </Link>
            <a
              href="#features"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session?.user ? (
              <Link href="/dashboard">
                <Button className="bg-[var(--waypoint-teal)] hover:bg-[var(--waypoint-teal)]/90 text-white rounded-full px-6 gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium hover:text-[var(--waypoint-teal)] transition-colors hidden sm:block"
                >
                  Log in
                </Link>
                <Link href="/register">
                  <Button className="bg-[var(--waypoint-navy)] text-white hover:bg-[var(--waypoint-teal)] transition-all rounded-full px-6">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-32 pb-24 px-4 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[var(--waypoint-teal)]/10 blur-3xl animate-pulse" />
            <div className="absolute top-40 right-1/4 h-56 w-56 rounded-full bg-[var(--waypoint-amber)]/10 blur-3xl animate-pulse [animation-delay:1s]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-40 w-full max-w-3xl bg-gradient-to-t from-[var(--waypoint-teal)]/5 to-transparent blur-2xl" />
          </div>

          <div className="container mx-auto max-w-6xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-sm font-medium mb-8 border border-zinc-200 dark:border-zinc-700">
              <span className="flex h-2 w-2 rounded-full bg-[var(--waypoint-teal)] animate-pulse" />
              Powered by Google Gemini AI
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95]">
              The intelligent way to
              <br />
              <span className="text-gradient-primary">
                plan your journey.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Create AI-powered custom itineraries in seconds, or book
              premium travel packages from verified agencies across India.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/trip-builder">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg bg-gradient-to-r from-[var(--waypoint-navy)] to-[var(--waypoint-teal)] text-white hover:opacity-90 shadow-xl shadow-[var(--waypoint-teal)]/20 gap-2"
                >
                  <Sparkles className="h-5 w-5" /> Try AI Trip Builder
                </Button>
              </Link>
              <Link href="/packages">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 h-14 text-lg bg-transparent border-zinc-300 dark:border-zinc-700 gap-2"
                >
                  Browse Packages <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card rounded-2xl p-5 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 text-[var(--waypoint-teal)] mb-1">
                    {stat.icon}
                    <span className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-24 px-4 bg-zinc-50/50 dark:bg-zinc-950/30"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-[var(--waypoint-teal)]/10 text-[var(--waypoint-teal)] border-[var(--waypoint-teal)]/20 px-4 py-1.5">
                <Zap className="h-3 w-3 mr-1" /> Core Features
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Everything you need to
                <br />
                <span className="text-gradient-primary">
                  travel smarter.
                </span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                From AI-generated itineraries to secure booking — Waypoint
                handles it all.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="glass-card group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0"
                >
                  <CardContent className="p-8">
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-tr ${feature.gradient} flex items-center justify-center text-white mb-5 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Plan in{" "}
                <span className="text-gradient-amber">3 simple steps</span>
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Tell us your dream trip",
                  description:
                    "Enter your destination, dates, budget, and interests. Our AI handles the rest.",
                  icon: <Sparkles className="h-5 w-5" />,
                },
                {
                  step: "02",
                  title: "Get a custom itinerary",
                  description:
                    "Receive a detailed day-by-day plan with hotels, activities, transport, and cost breakdown.",
                  icon: <Clock className="h-5 w-5" />,
                },
                {
                  step: "03",
                  title: "Book and go!",
                  description:
                    "Book directly through Waypoint or pick a curated package from our partner agencies.",
                  icon: <Plane className="h-5 w-5" />,
                },
              ].map((item) => (
                <div key={item.step} className="text-center group">
                  <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-5 group-hover:bg-[var(--waypoint-teal)]/10 transition-colors">
                    <span className="text-2xl font-bold text-[var(--waypoint-teal)]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-4 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-pink-500/10 text-pink-500 border-pink-500/20 px-4 py-1.5">
                <Heart className="h-3 w-3 mr-1" /> Loved by Travelers
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                What our users say
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <Card
                  key={t.name}
                  className="glass-card hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-[var(--waypoint-amber)] text-[var(--waypoint-amber)]"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--waypoint-navy)] via-zinc-900 to-zinc-950 p-12 md:p-16 text-center text-white">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[var(--waypoint-teal)]/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[var(--waypoint-amber)]/15 blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                  Ready to explore?
                </h2>
                <p className="text-zinc-300 text-lg max-w-xl mx-auto mb-8">
                  Join thousands of travelers using Waypoint to plan
                  unforgettable trips with the power of AI.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="rounded-full px-8 h-14 text-lg bg-gradient-to-r from-[var(--waypoint-teal)] to-sky-400 text-white shadow-xl shadow-[var(--waypoint-teal)]/30 gap-2"
                    >
                      Get Started Free <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/trip-builder">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full px-8 h-14 text-lg border-white/20 text-white hover:bg-white/10 gap-2"
                    >
                      <Sparkles className="h-5 w-5" /> Try AI Builder
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 px-4 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--waypoint-teal)] to-[var(--waypoint-navy)] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                  <span className="text-lg font-bold tracking-tight">
                    Waypoint
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-powered travel planning, booking, and operations platform
                  for the modern traveler.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Product</h4>
                <nav className="space-y-2">
                  <Link
                    href="/packages"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Browse Packages
                  </Link>
                  <Link
                    href="/trip-builder"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    AI Trip Builder
                  </Link>
                  <Link
                    href="/register"
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    For Agencies
                  </Link>
                </nav>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Company</h4>
                <nav className="space-y-2">
                  <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </Link>
                  <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                  <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </nav>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Support</h4>
                <nav className="space-y-2">
                  <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Help Center
                  </Link>
                  <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    API Docs
                  </Link>
                </nav>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 flex items-center justify-between text-xs text-muted-foreground">
              <p>
                © {new Date().getFullYear()} Waypoint. All rights reserved.
              </p>
              <div className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                <span>INR base currency</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
