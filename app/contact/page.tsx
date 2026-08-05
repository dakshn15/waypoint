"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      toast.success("Thank you! Your message has been successfully received. We will get back to you shortly.");
      setSubject("");
      setMessage("");
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:text-[#769ABC] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <Link href="/dashboard">
                <Button className="bg-[#769ABC] hover:bg-[#769ABC]/90 text-white rounded-full px-6">
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
      <main className="flex-grow container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            Contact <span className="text-[#E46F44]">Support</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about our travel planner or looking to onboard your travel agency? We are here to help.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Details Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  <MessageSquare className="h-5 w-5 text-[#769ABC]" />
                  Contact Info
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Send us a support query or contact our administration directly. Our operational team responds within 24 hours.
                </p>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Support Email</p>
                      <a href="mailto:support@waypoint.dev" className="text-[#769ABC] hover:underline">
                        support@waypoint.dev
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Phone Support</p>
                      <span className="text-slate-600">+91 98765 43210</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Headquarters</p>
                      <span className="text-slate-600">DLF CyberCity, Phase 3, Gurugram, HR, India</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Column */}
          <div className="md:col-span-3">
            <Card className="glass-card border border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Send Message</CardTitle>
                <CardDescription className="text-slate-600">Fill out this form and our support agents will coordinate with you.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Agency onboarding, payment issue, etc."
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we assist you?"
                      rows={5}
                      className="bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1A3B5A] hover:bg-[#769ABC] text-white gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? "Sending..." : "Submit Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
