import "../lib/storage-polyfill";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Waypoint | AI-Powered Travel Planning & Booking",
  description: "Plan your perfect trip with Waypoint's AI trip builder, or book pre-designed packages from top travel agencies.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", inter.variable, plusJakarta.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
