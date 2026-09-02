import Link from "next/link";
import { Compass, MapPin, Shield, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lg:h-screen lg:overflow-hidden flex font-sans">

      {/* ═══ LEFT PANEL: IMMERSIVE VISUAL ═══ */}
      <div className="hidden lg:flex lg:w-[50%] gap-5 bg-secondary relative overflow-hidden flex-col justify-between p-8 xl:p-10">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1400&auto=format&fit=crop&q=80')" }}
        />
        {/* Dark Overlay Gradient — uses brand navy */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-secondary/85 to-secondary/90" />
        {/* Ambient Glow — brand coral */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[160px] pointer-events-none" />

        {/* Top Logo Area */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Way<span className="text-primary">point</span>
            </span>
          </Link>
        </div>

        {/* Center Headline */}
        <div className="relative z-10 space-y-5 max-w-lg">
          <h2 className="text-3xl xl:text-5xl font-bold tracking-tight leading-[1.1] text-white">
            Your next adventure{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-wp-primary-light bg-clip-text text-transparent">
              starts here.
            </span>
          </h2>
          <p className="text-sm xl:text-base text-white/60 leading-relaxed max-w-md">
            Join thousands of travelers who plan, book, and experience their dream trips through Waypoint&apos;s AI-powered platform.
          </p>

          {/* Trust Indicators — brand colors only */}
          <div className="flex items-center gap-4 xl:gap-6 pt-1 flex-wrap">
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <Shield className="h-4 w-4 text-accent" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              <span>50+ Destinations</span>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Gemini AI</span>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 xl:p-5 max-w-md">
          <p className="text-xs xl:text-sm text-white/80 leading-relaxed italic">
            &ldquo;Waypoint planned our entire Rajasthan trip in under 30 seconds.
            The AI itinerary was so detailed we didn&apos;t miss a single experience.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
              AK
            </div>
            <div>
              <p className="text-xs font-bold text-white">Arjun Kapoor</p>
              <p className="text-[11px] text-white/40">Solo Traveler • 7-day Rajasthan Trip</p>
            </div>
          </div>
        </div>
      </div>


      {/* ═══ RIGHT PANEL: AUTH FORM ═══ */}
      <div className="flex-1 flex flex-col lg:h-screen lg:overflow-y-auto bg-[#FAFAF9]">

        {/* Mobile Logo (shows only below lg) */}
        <div className="lg:hidden flex items-center justify-center pt-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Compass className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-secondary">
              Way<span className="text-primary">point</span>
            </span>
          </Link>
        </div>

        {/* Form Container — Vertically Centered */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 lg:py-4">
          <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 sm:p-7 shadow-lg">
            {children}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="text-center pb-4 px-4 shrink-0">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Waypoint. All rights reserved. By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-secondary">Terms</Link> &{" "}
            <Link href="/privacy" className="underline hover:text-secondary">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
