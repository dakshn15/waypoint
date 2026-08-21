"use client";

import { useEffect, useRef } from "react";
import {
  Sparkles,
  Shield,
  Users,
  Globe,
  Zap,
  Heart,
  ArrowRight,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";

const pillars = [
  {
    icon: Sparkles,
    title: "AI-First Planning",
    description: "Personalized itineraries by Google Gemini AI in under 30 seconds.",
  },
  {
    icon: Users,
    title: "Traveler × Agency",
    description: "Connecting explorers with verified regional agencies directly.",
  },
  {
    icon: Shield,
    title: "Trusted & Secure",
    description: "Every transaction encrypted via Stripe & Razorpay gateways.",
  },
  {
    icon: Globe,
    title: "50+ Destinations",
    description: "Deep regional knowledge across India's most iconic locations.",
  },
  {
    icon: Zap,
    title: "All-in-One Platform",
    description: "AI trips, bookings, payments, vendor ops — all unified.",
  },
  {
    icon: Heart,
    title: "Built by Travelers",
    description: "Founded by enthusiasts who hated spreadsheet trip planning.",
  },
];

export default function AboutPage() {
  const { data: session } = useSession();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroRef.current.style.setProperty("--mx", `${x}%`);
      heroRef.current.style.setProperty("--my", `${y}%`);
    };
    const el = heroRef.current;
    if (el) el.addEventListener("mousemove", handleMouseMove);
    return () => { if (el) el.removeEventListener("mousemove", handleMouseMove); };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9] text-slate-900 font-sans">
      <SiteHeader userSession={session} />

      {/* ═══ HERO — IMMERSIVE GRADIENT CHASE ═══ */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(0.97); }
          66% { transform: translate(20px, -15px) scale(1.03); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.15; transform: translate(-50%, -50%) scale(1.03); }
        }
        @keyframes spin-very-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      <section
        ref={heroRef}
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAFAF9] via-[#F6F3F0] to-[#FAFAF9]"
        style={
          {
            "--mx": "50%",
            "--my": "50%",
          } as React.CSSProperties
        }
      >
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #CBD5E1 0.8px, transparent 0.8px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Mouse-following gradient spotlight */}
        <div
          className="absolute inset-0 transition-all duration-[1200ms] ease-out pointer-events-none"
          style={{
            background:
              "radial-gradient(650px circle at var(--mx) var(--my), rgba(228,111,68,0.12), transparent 55%)",
          }}
        />

        {/* Gradient mesh overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(228,111,68,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(26,59,90,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(228,111,68,0.03) 0%, transparent 40%)",
          }}
        />

        {/* Animated floating orbs */}
        <div
          className="absolute top-[12%] left-[8%] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(228,111,68,0.1) 0%, transparent 70%)",
            animation: "float-slow 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[8%] right-[5%] w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(26,59,90,0.08) 0%, transparent 70%)",
            animation: "float-slow-reverse 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[50%] right-[20%] w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(228,111,68,0.06) 0%, transparent 70%)",
            animation: "float-slow 10s ease-in-out infinite 2s",
          }}
        />

        {/* Large compass rose SVG watermark */}
        <div
          className="absolute top-1/2 left-1/2 w-[650px] h-[650px] pointer-events-none opacity-[0.04]"
          style={{ animation: "spin-very-slow 120s linear infinite" }}
        >
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="95" stroke="#1A3B5A" strokeWidth="1" />
            <circle cx="100" cy="100" r="85" stroke="#1A3B5A" strokeWidth="0.5" />
            {/* Cardinal points */}
            <path d="M100 5 L105 45 L100 35 L95 45 Z" fill="#1A3B5A" />
            <path d="M100 195 L95 155 L100 165 L105 155 Z" fill="#1A3B5A" />
            <path d="M5 100 L45 95 L35 100 L45 105 Z" fill="#1A3B5A" />
            <path d="M195 100 L155 105 L165 100 L155 95 Z" fill="#1A3B5A" />
            {/* Intercardinal points */}
            <path d="M32 32 L60 55 L50 52 L55 62 Z" fill="#1A3B5A" opacity="0.6" />
            <path d="M168 32 L140 55 L150 52 L145 62 Z" fill="#1A3B5A" opacity="0.6" />
            <path d="M32 168 L55 140 L52 150 L62 145 Z" fill="#1A3B5A" opacity="0.6" />
            <path d="M168 168 L145 140 L148 150 L138 145 Z" fill="#1A3B5A" opacity="0.6" />
            {/* Inner circle */}
            <circle cx="100" cy="100" r="12" stroke="#1A3B5A" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="4" fill="#1A3B5A" />
            {/* Degree ticks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = (i * 10 * Math.PI) / 180;
              const r1 = 90;
              const r2 = i % 3 === 0 ? 82 : 86;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={Math.round((100 + r1 * cos) * 100) / 100}
                  y1={Math.round((100 + r1 * sin) * 100) / 100}
                  x2={Math.round((100 + r2 * cos) * 100) / 100}
                  y2={Math.round((100 + r2 * sin) * 100) / 100}
                  stroke="#1A3B5A"
                  strokeWidth={i % 3 === 0 ? 1 : 0.5}
                />
              );
            })}
          </svg>
        </div>

        {/* Decorative pulsing rings */}
        <div
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full border border-slate-300/30 pointer-events-none"
          style={{ animation: "pulse-ring 6s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[520px] h-[520px] rounded-full border border-slate-300/20 pointer-events-none"
          style={{ animation: "pulse-ring 6s ease-in-out infinite 1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[340px] h-[340px] rounded-full border border-primary/10 pointer-events-none"
          style={{ animation: "pulse-ring 6s ease-in-out infinite 2s" }}
        />

        {/* Vignette edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(250,250,249,0.8) 100%)",
          }}
        />

        <div className="relative z-10 text-center max-w-3xl px-4">
          {/* Overline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Compass className="h-3 w-3 text-white" />
            </div>
            About Waypoint
          </div>

          <h1 className="text-[2.5rem] md:text-[4.5rem] font-extrabold tracking-tight text-secondary leading-[1.05] mb-6">
            Travel planning,
            <br />
            <span className="text-primary">reimagined.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl mx-auto mb-10 font-medium">
            AI meets local expertise. Waypoint turns the chaos of trip research
            into a single, intelligent experience.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/trip-builder"
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-xl shadow-primary/20 active:scale-[0.97]"
            >
              <Sparkles className="h-4 w-4" />
              Try AI Trip Builder
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white border border-slate-200 text-slate-700 text-sm font-bold transition-all shadow-sm"
            >
              Browse Packages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <section className="border-y border-slate-200/80 bg-white">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200/60">
            {[
              { value: "50+", label: "Destinations" },
              { value: "10K+", label: "Travelers" },
              { value: "200+", label: "Packages" },
              { value: "<30s", label: "AI Trip Plans" },
            ].map((s) => (
              <div key={s.label} className="py-8 md:py-10 text-center">
                <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-secondary">
                  {s.value}
                </p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OUR STORY — BIG QUOTE + NARRATIVE ═══ */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Big pull quote */}
          <div className="mb-16 md:mb-20">
            <div className="w-12 h-1.5 rounded-full bg-primary mb-8" />
            <blockquote className="text-2xl md:text-[2.1rem] font-extrabold text-secondary leading-[1.35] tracking-tight">
              &ldquo;We spent three weeks planning a seven-day trip — browsing
              twenty tabs, comparing unverified operators, building
              spreadsheets.{" "}
              <span className="text-primary">
                There had to be a better way.
              </span>
              &rdquo;
            </blockquote>
            <p className="text-sm text-slate-400 font-semibold mt-5">
              — The founding team, January 2026
            </p>
          </div>

          {/* Narrative paragraphs */}
          <div className="grid md:grid-cols-2 gap-x-14 gap-y-6">
            <p className="text-[15px] text-slate-500 leading-[1.85]">
              That frustration became Waypoint. A group of travel enthusiasts and
              software engineers came together with a simple question:{" "}
              <em className="text-slate-700">
                why is trip planning still this painful?
              </em>
            </p>
            <p className="text-[15px] text-slate-500 leading-[1.85]">
              We built a platform bridging{" "}
              <strong className="text-secondary font-bold">
                Google Gemini AI
              </strong>{" "}
              with a verified network of{" "}
              <strong className="text-secondary font-bold">
                local travel agencies
              </strong>{" "}
              — transforming scattered research into seamless journeys.
            </p>
            <p className="text-[15px] text-slate-500 leading-[1.85]">
              Today, Waypoint serves thousands of traveler accounts and helps
              dozens of verified agencies automate packages, vendor
              coordination, and booking transactions under a single dashboard.
            </p>
            <p className="text-[15px] text-slate-500 leading-[1.85]">
              Our mission:{" "}
              <strong className="text-primary font-bold">
                make travel planning as exciting as the trip itself
              </strong>
              — by combining artificial intelligence with human local expertise,
              accessible to every explorer.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ CORE PILLARS — CLEAN GRID ═══ */}
      <section className="py-20 bg-white border-y border-slate-200/60">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-secondary">
                What drives us
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md">
                Six principles shaping every feature we build.
              </p>
            </div>
            <div className="w-12 h-1.5 rounded-full bg-primary" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200/60 rounded-2xl overflow-hidden border border-slate-200/60">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className="bg-white p-7 hover:bg-[#FAFAF9] transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${
                    i % 2 === 0
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary"
                  } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-[15px] text-secondary mb-1.5">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CAPABILITIES — DARK ═══ */}
      <section className="py-24 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(228,111,68,0.1),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container mx-auto max-w-4xl px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Everything unified.{" "}
            <span className="text-primary">Nothing scattered.</span>
          </h2>
          <p className="text-sm text-white/40 max-w-lg mx-auto mb-12">
            AI trip generation, booking management, vendor coordination, secure
            payments — all under one platform.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
            {[
              "AI trip generation via Google Gemini",
              "Verified agency onboarding",
              "Stripe & Razorpay payments",
              "Real-time booking tracking",
              "Multi-role dashboards",
              "Budget validation engine",
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-5 py-4 hover:bg-white/[0.08] transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-white/65 font-medium">
                  {f}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/25"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
            <Compass className="h-7 w-7" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-secondary tracking-tight mb-4">
            Your next adventure
            <br />
            starts here.
          </h2>
          <p className="text-base text-slate-400 mb-8 max-w-sm mx-auto">
            Join thousands of travelers planning smarter with AI.
          </p>
          <Link
            href="/trip-builder"
            className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-secondary hover:bg-secondary/90 text-white text-sm font-bold transition-all shadow-xl shadow-secondary/15 active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4" />
            Start Planning
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
