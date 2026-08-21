"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

      <main className="flex-grow md:pt-36 pt-28 pb-20">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="max-w-2xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-secondary leading-[1.1] mb-4">
              We&apos;d love to{" "}
              <span className="text-primary">hear from you.</span>
            </h1>
            <p className="text-base text-slate-500 leading-relaxed">
              Questions about trip planning, agency onboarding, payments, or anything else? Our team is here to help.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* ═══ LEFT: CONTACT CHANNELS ═══ */}
            <div className="lg:col-span-2 space-y-4">
              {contactChannels.map((ch) => (
                <a
                  key={ch.title}
                  href={ch.href}
                  className="group flex items-start gap-4 bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/40 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <ch.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-secondary">{ch.title}</p>
                    <p className="text-sm text-slate-700 font-medium">{ch.detail}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ch.sub}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* ═══ RIGHT: CONTACT FORM ═══ */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-7 md:p-9 shadow-sm">
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Send className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-extrabold text-secondary">Message Received!</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Thank you for reaching out. Our support team will respond within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-2 cursor-pointer mt-2"
                    >
                      Send another message
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <h2 className="text-xl font-extrabold text-secondary">Send a Message</h2>
                      <p className="text-xs text-slate-500 mt-1">Fill out the form and our team will coordinate with you.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label
                            htmlFor="contact-name"
                            className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === "name" ? "text-primary" : "text-slate-500"}`}
                          >
                            Your Name
                          </label>
                          <input
                            id="contact-name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setFocusedField("name")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="John Doe"
                            className="w-full h-11 px-4 rounded-xl bg-[#FAFAF9] border-2 border-slate-200/80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor="contact-email"
                            className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === "email" ? "text-primary" : "text-slate-500"}`}
                          >
                            Your Email
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="you@example.com"
                            className="w-full h-11 px-4 rounded-xl bg-[#FAFAF9] border-2 border-slate-200/80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="contact-subject"
                          className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === "subject" ? "text-primary" : "text-slate-500"}`}
                        >
                          Subject
                        </label>
                        <input
                          id="contact-subject"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          onFocus={() => setFocusedField("subject")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Agency onboarding, payment issue, etc."
                          className="w-full h-11 px-4 rounded-xl bg-[#FAFAF9] border-2 border-slate-200/80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="contact-message"
                          className={`text-xs font-bold uppercase tracking-wider transition-colors ${focusedField === "message" ? "text-primary" : "text-slate-500"}`}
                        >
                          Message
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onFocus={() => setFocusedField("message")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="How can we assist you?"
                          rows={5}
                          className="w-full px-4 py-3 rounded-xl bg-[#FAFAF9] border-2 border-slate-200/80 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 cursor-pointer"
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
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
