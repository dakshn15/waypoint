"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Users,
  Mail,
  DollarSign,
  CalendarCheck,
  ChevronRight,
  Package,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TravelerBooking {
  id: string;
  packageTitle: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  travelDate: string;
  createdAt: string;
}

interface Traveler {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  bookingsCount: number;
  totalSpent: number;
  lastBooking: string;
  bookings: TravelerBooking[];
}

interface TravelersClientProps {
  travelers: Traveler[];
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-secondary/10 text-secondary border-secondary/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PENDING: "bg-primary/10 text-primary border-primary/20",
  PROCESSING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CANCELLED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function TravelersClient({ travelers }: TravelersClientProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Traveler | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return travelers;
    return travelers.filter(
      (t) =>
        t.user.name?.toLowerCase().includes(q) ||
        t.user.email?.toLowerCase().includes(q)
    );
  }, [travelers, search]);

  const initials = (name: string | null) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "T";

  return (
    <>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search travelers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-slate-200 bg-white text-sm"
        />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Travelers", value: travelers.length, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
          { label: "Total Bookings", value: travelers.reduce((s, t) => s + t.bookingsCount, 0), icon: CalendarCheck, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Revenue", value: formatCurrency(travelers.reduce((s, t) => s + t.totalSpent, 0), "INR"), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-400 font-semibold">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Travelers Table */}
      <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Traveler", "Email", "Bookings", "Total Spent", "Last Booking", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                    {search ? "No travelers match your search." : "No travelers yet. Bookings will appear here."}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.user.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelected(t)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {initials(t.user.name)}
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">{t.user.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{t.user.email || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-bold bg-primary/5 text-primary border-primary/20">
                        {t.bookingsCount} booking{t.bookingsCount !== 1 ? "s" : ""}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(t.totalSpent, "INR")}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-medium">
                      {formatDate(new Date(t.lastBooking))}
                    </td>
                    <td className="px-4 py-3">
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Traveler Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md bg-white border-l border-slate-200 p-0 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-white font-extrabold text-xl shrink-0">
                    {initials(selected.user.name)}
                  </div>
                  <div>
                    <SheetTitle className="text-lg font-bold text-slate-900">{selected.user.name || "Unknown"}</SheetTitle>
                    <SheetDescription className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                      <Mail className="h-3.5 w-3.5" /> {selected.user.email}
                    </SheetDescription>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xl font-extrabold text-slate-900">{selected.bookingsCount}</p>
                    <p className="text-xs text-slate-400 font-semibold">Bookings</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(selected.totalSpent, "INR")}</p>
                    <p className="text-xs text-slate-400 font-semibold">Total Spent</p>
                  </div>
                </div>
              </SheetHeader>

              {/* Booking History */}
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-secondary" />
                  Booking History
                </h3>
                {selected.bookings.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Package className="h-8 w-8 text-slate-200 mb-2" />
                    <p className="text-xs text-slate-400">No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selected.bookings.map((b) => (
                      <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Package className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900 line-clamp-1">{b.packageTitle || "Custom Trip"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{formatDate(new Date(b.travelDate))}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(b.totalAmount, b.currency)}</p>
                          <Badge variant="outline" className={`text-[9px] font-bold tracking-wider mt-1 ${STATUS_STYLE[b.status] || "bg-slate-100 text-slate-600"}`}>
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
