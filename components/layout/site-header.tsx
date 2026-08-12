"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Sparkles,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

interface SiteHeaderProps {
  /** Pass session object (or null) to control CTA state */
  userSession?: any;
  /** Currently active route, used to highlight nav link */
  activeRoute?: string;
}

export function SiteHeader({ userSession, activeRoute }: SiteHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Packages", href: "/packages" },
    { label: "AI Builder", href: "/trip-builder", icon: <Sparkles className="h-3 w-3 text-primary" /> },
    { label: "Destinations", href: "/#destinations" },
    { label: "Features", href: "/#features" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <header className="fixed top-5 left-0 right-0 z-50">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-full flex items-center justify-between md:p-3 p-2.5 shadow-md relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 text-[15px]">Way<span className="text-primary">point</span></span>
          </Link>

          {/* Desktop Nav Links (lg and above) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-800">
            {navLinks.map((link) => {
              const isActive = activeRoute === link.href;
              const isHashLink = link.href.startsWith("/#");
              const LinkTag = isHashLink ? "a" : Link;
              const href = isHashLink ? link.href.replace("/", "") : link.href;

              return (
                <LinkTag
                  key={link.label}
                  href={href}
                  className={`hover:text-primary transition-colors flex items-center gap-1 ${isActive ? "text-primary" : ""}`}
                >
                  {link.icon}
                  {link.label}
                </LinkTag>
              );
            })}
          </nav>

          {/* Desktop CTA Buttons & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {userSession ? (
              <Link href="/dashboard" className="hidden lg:block">
                <Button className="rounded-full font-semibold text-sm bg-primary hover:bg-primary/90 text-white">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/login" className="text-[13px] font-semibold text-slate-600 hover:text-primary transition-colors">
                  Log in
                </Link>
                <Link href="/register">
                  <Button className="rounded-full font-semibold text-sm bg-secondary hover:bg-secondary/90 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Hamburger Button for Mobile / Tablet (< lg) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-primary hover:bg-slate-100 rounded-full transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1 font-semibold text-slate-700 text-sm">
              {navLinks.map((link) => {
                const isActive = activeRoute === link.href;
                const isHashLink = link.href.startsWith("/#");
                const LinkTag = isHashLink ? "a" : Link;
                const href = isHashLink ? link.href.replace("/", "") : link.href;

                return (
                  <LinkTag
                    key={link.label}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-md hover:bg-slate-100/80 hover:text-primary transition-colors flex items-center gap-2 ${
                      isActive ? "bg-primary/5 text-primary" : ""
                    }`}
                  >
                    {link.icon && <span className="text-primary">{link.icon}</span>}
                    {link.label}
                  </LinkTag>
                );
              })}

              {/* Mobile CTAs */}
              <div className="pt-3 mt-1 border-t border-slate-100 flex flex-col gap-2">
                {userSession ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <Button className="w-full justify-between">
                      Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full rounded-xl font-semibold text-sm border-slate-200 text-slate-700 hover:bg-slate-50 justify-center">
                        Log in
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <Button className="w-full rounded-xl font-semibold text-sm bg-secondary hover:bg-secondary/90 text-white justify-center">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
