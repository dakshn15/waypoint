"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, ArrowRight, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SOCIAL_ICONS = [
  { label: "Instagram", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> },
  { label: "Twitter", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg> },
  { label: "LinkedIn", icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg> },
];

const PRODUCT_LINKS = [
  { label: "AI Trip Builder", href: "/trip-builder" },
  { label: "Tour Packages", href: "/packages" },
  { label: "Agency Dashboard", href: "/dashboard" },
  { label: "Vendor Portal", href: "/dashboard/vendors" },
];

const DESTINATION_LINKS = ["Manali & Solang", "Kerala Backwaters", "Jaipur & Udaipur", "Goa Beaches", "Ladakh"];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

interface SiteFooterProps {
  /** Optional custom content override for the right column of the top section */
  children?: React.ReactNode;
}

export function SiteFooter({ children }: SiteFooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      toast.success("Subscribed! You will receive weekly AI travel digests.");
      setNewsletterEmail("");
    } else {
      toast.error("Please enter a valid email address.");
    }
  };

  return (
    <footer className="footer-sec relative bg-[#09111b] text-slate-400 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_30%,transparent_100%)] pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Top section: Brand + Newsletter ── */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 lg:pt-16 pt-10 lg:pb-12 pb-8 border-b border-white/[0.06]">
          <div className="max-w-md mx-auto text-center sm:mx-0 sm:text-start">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/15 group-hover:shadow-primary/30 transition-shadow">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold font-display text-white tracking-tight">
                Way<span className="text-primary">point</span>
              </span>
            </Link>
            <p className="text-[15px] sm:leading-relaxed">
              AI-powered travel platform that turns your ideas into{" "}
              <span className="text-slate-200 font-medium">complete, bookable itineraries</span>{" "}
              in under a minute.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {children ? (
              children
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-3">Get weekly travel intelligence</p>
                <form onSubmit={handleSubscribe} className="flex sm:flex-row flex-col gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <Input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/30 w-full"
                    />
                  </div>
                  <Button type="submit">
                    Subscribe <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* ── Link columns ── */}
        <div className="grid sm:grid-cols-2 grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 lg:py-12 py-8">
          {/* Product */}
          <div>
            <h5 className="text-base font-bold uppercase tracking-widest text-white mb-5">Product</h5>
            <nav className="sm:space-y-3 space-y-2">
              {PRODUCT_LINKS.map(link => (
                <Link key={link.label} href={link.href}
                  className="group flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors duration-200">
                  <ArrowRight className="h-3 w-3 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-70 md:group-hover:translate-x-0 transition-all duration-200" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Destinations */}
          <div>
            <h5 className="text-base font-bold uppercase tracking-widest text-white mb-5">Destinations</h5>
            <nav className="sm:space-y-3 space-y-2">
              {DESTINATION_LINKS.map(d => (
                <Link key={d} href="/packages"
                  className="group flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors duration-200">
                  <ArrowRight className="h-3 w-3 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-70 md:group-hover:translate-x-0 transition-all duration-200" />
                  <span>{d}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-base font-bold uppercase tracking-widest text-white mb-5">Company</h5>
            <nav className="sm:space-y-3 space-y-2">
              {COMPANY_LINKS.map(link => (
                <Link key={link.label} href={link.href}
                  className="group flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors duration-200">
                  <ArrowRight className="h-3 w-3 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-70 md:group-hover:translate-x-0 transition-all duration-200" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div>
            <h5 className="text-base font-bold uppercase tracking-widest text-white mb-5">Connect</h5>
            <div className="flex gap-3">
              {SOCIAL_ICONS.map(s => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="h-9 w-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-200">
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar — padded on mobile so floating bottom bar never covers legal links ── */}
        <div className="border-t border-white/[0.06] py-5 pb-20 lg:pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 gap-y-2">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Waypoint Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
