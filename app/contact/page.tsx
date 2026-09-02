"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const contactChannels = [
  {
    icon: Mail,
    title: "Email Us",
    detail: "support@waypoint.dev",
    sub: "We reply within 24 hours",
    href: "mailto:support@waypoint.dev",
  },
  {
    icon: Phone,
    title: "Call Us",
    detail: "+91 98765 43210",
    sub: "Mon–Fri, 9 AM – 6 PM IST",
    href: "tel:+919876543210",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    detail: "DLF CyberCity, Phase 3",
    sub: "Gurugram, Haryana, India",
    href: "#",
  },
  {
    icon: Clock,
    title: "Business Hours",
    detail: "9:00 AM – 6:00 PM",
    sub: "Monday through Friday (IST)",
    href: "#",
  },
];

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent! Our team will get back to you within 24 hours.");
      setSubject("");
      setMessage("");
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9] text-slate-900 font-sans">
      <SiteHeader userSession={session} />

      <main className="flex-grow">
        {/* ═══════════════ CENTERED HERO SECTION WITH RICH AMBIENT BACKGROUND ═══════════════ */}
        <section className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 lg:pb-16 overflow-hidden bg-gradient-to-b from-[#FAFAF9] via-[#F6F3F0] to-[#FAFAF9] border-b border-slate-200/60">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-secondary/8 rounded-full blur-[120px] pointer-events-none" />

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm text-xs font-bold text-slate-600 uppercase tracking-widest mb-5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Get in Touch
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-slate-900 font-display mb-4">
              We&apos;d love to{" "}
              <span className="text-primary">hear from you.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
              Questions about trip planning, agency onboarding, payments, or custom itineraries? Our team is available to help.
            </p>
          </div>
        </section>


        {/* ═══════════════ MAIN CONTENT SECTION ═══════════════ */}
        <section className="lg:py-20 py-12">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-5 gap-8 items-start">

              {/* ═══ LEFT: CONTACT CHANNELS ═══ */}
              <div className="md:col-span-2 space-y-4">
                {contactChannels.map((ch) => (
                  <a
                    key={ch.title}
                    href={ch.href}
                    className="group flex items-start gap-4 bg-white rounded-xl border border-slate-200/80 p-4 lg:p-6 hover:shadow-xl hover:shadow-slate-200/40 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <ch.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{ch.title}</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{ch.detail}</p>
                      <p className="text-xs text-slate-500 mt-1">{ch.sub}</p>
                    </div>
                  </a>
                ))}
              </div>


              {/* ═══ RIGHT: CONTACT FORM ═══ */}
              <div className="md:col-span-3">
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-sm">
                  {submitted ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
                        <Send className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 font-display">Message Received!</h3>
                      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Thank you for reaching out. Our support team will respond within 24 hours.
                      </p>
                      <Button
                        onClick={() => setSubmitted(false)}
                        variant="ghost"
                        className="font-bold text-primary hover:text-primary hover:bg-primary/5 cursor-pointer mt-2"
                      >
                        Send another message
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-7">
                        <h2 className="text-xl font-bold text-slate-900 font-display">Send a Message</h2>
                        <p className="text-xs text-slate-500 mt-1">Fill out the form below and our team will get back to you shortly.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label
                              htmlFor="contact-name"
                              className="text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                              Your Name
                            </Label>
                            <Input
                              id="contact-name"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="contact-email"
                              className="text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                              Your Email
                            </Label>
                            <Input
                              id="contact-email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="contact-subject"
                            className="text-xs font-bold uppercase tracking-wider text-slate-500"
                          >
                            Subject
                          </Label>
                          <Input
                            id="contact-subject"
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Agency onboarding, payment issue, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="contact-message"
                            className="text-xs font-bold uppercase tracking-wider text-slate-500"
                          >
                            Message
                          </Label>
                          <Textarea
                            id="contact-message"
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="How can we assist you?"
                            rows={5}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={submitting}
                          size="lg"
                          className="w-full font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Submit Message
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
