"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search,
  Building2,
  Globe,
  Mail,
  Phone,
  CalendarCheck,
  Package,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toggleAgencyVerification, toggleAgencyActive } from "@/app/actions/admin";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Agency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  verified: boolean;
  active: boolean;
  ownerName: string;
  ownerEmail: string;
  packagesCount: number;
  bookingsCount: number;
  staffCount: number;
  createdAt: Date;
}

interface AgenciesListProps {
  initialAgencies: Agency[];
}

export function AgenciesList({ initialAgencies }: AgenciesListProps) {
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const handleToggleVerification = async (agencyId: string) => {
    startTransition(async () => {
      const result = await toggleAgencyVerification(agencyId);
      if (result.success) {
        setAgencies((prev) =>
          prev.map((a) => (a.id === agencyId ? { ...a, verified: !a.verified } : a))
        );
        const agency = agencies.find((a) => a.id === agencyId);
        toast.success(
          `Agency "${agency?.name}" is now ${
            !agency?.verified ? "Verified" : "Unverified"
          }`
        );
      } else {
        toast.error(result.error || "Failed to toggle verification");
      }
    });
  };

  const handleToggleActive = async (agencyId: string) => {
    startTransition(async () => {
      const result = await toggleAgencyActive(agencyId);
      if (result.success) {
        setAgencies((prev) =>
          prev.map((a) => (a.id === agencyId ? { ...a, active: !a.active } : a))
        );
        const agency = agencies.find((a) => a.id === agencyId);
        toast.success(
          `Agency "${agency?.name}" status updated to ${
            !agency?.active ? "Active" : "Suspended"
          }`
        );
      } else {
        toast.error(result.error || "Failed to toggle active status");
      }
    });
  };

  const filteredAgencies = agencies.filter((agency) => {
    const matchesSearch =
      agency.name.toLowerCase().includes(search.toLowerCase()) ||
      agency.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      (agency.email && agency.email.toLowerCase().includes(search.toLowerCase()));

    const matchesVerified =
      filterVerified === "ALL" ||
      (filterVerified === "VERIFIED" && agency.verified) ||
      (filterVerified === "UNVERIFIED" && !agency.verified);

    return matchesSearch && matchesVerified;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-500/5 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <Button
              variant={filterVerified === "ALL" ? "default" : "outline"}
              onClick={() => setFilterVerified("ALL")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterVerified === "VERIFIED" ? "default" : "outline"}
              onClick={() => setFilterVerified("VERIFIED")}
              size="sm"
              className={filterVerified === "VERIFIED" ? "bg-[var(--waypoint-teal)] hover:bg-[var(--waypoint-teal)]/90 text-white" : ""}
            >
              Verified Only
            </Button>
            <Button
              variant={filterVerified === "UNVERIFIED" ? "default" : "outline"}
              onClick={() => setFilterVerified("UNVERIFIED")}
              size="sm"
            >
              Unverified
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid List */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredAgencies.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              No agencies found matching your filters.
            </div>
          ) : (
            filteredAgencies.map((agency) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <Card className={`glass-card h-full flex flex-col justify-between overflow-hidden border ${
                  agency.active ? "border-zinc-200 dark:border-zinc-800" : "border-rose-500/20"
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--waypoint-teal)] to-sky-500 flex items-center justify-center text-white">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-xl flex items-center gap-1.5 font-bold">
                            {agency.name}
                            {agency.verified ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-amber-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Created on {formatDate(new Date(agency.createdAt))}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={agency.active ? "default" : "destructive"}>
                        {agency.active ? "Active" : "Suspended"}
                      </Badge>
                    </div>
                    {agency.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {agency.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                    {/* Contacts & Metadata */}
                    <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {agency.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{agency.email}</span>
                        </div>
                      )}
                      {agency.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{agency.phone}</span>
                        </div>
                      )}
                      {agency.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={agency.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-[var(--waypoint-teal)]"
                          >
                            {agency.website}
                          </a>
                        </div>
                      )}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-2">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Owner Details</p>
                        <p className="text-sm font-medium mt-0.5 text-zinc-800 dark:text-zinc-200">
                          {agency.ownerName} ({agency.ownerEmail})
                        </p>
                      </div>
                    </div>

                    {/* Stats Counter */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-zinc-500/5 dark:bg-zinc-950/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Package className="h-3 w-3" /> Packages
                        </p>
                        <p className="text-lg font-bold mt-0.5">{agency.packagesCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <CalendarCheck className="h-3 w-3" /> Bookings
                        </p>
                        <p className="text-lg font-bold mt-0.5">{agency.bookingsCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" /> Staff
                        </p>
                        <p className="text-lg font-bold mt-0.5">{agency.staffCount}</p>
                      </div>
                    </div>

                    {/* Control Switches */}
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`verify-${agency.id}`}
                          checked={agency.verified}
                          onCheckedChange={() => handleToggleVerification(agency.id)}
                          disabled={isPending}
                        />
                        <Label htmlFor={`verify-${agency.id}`} className="text-xs font-medium cursor-pointer">
                          Verified Profile
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${agency.id}`}
                          checked={agency.active}
                          onCheckedChange={() => handleToggleActive(agency.id)}
                          disabled={isPending}
                        />
                        <Label htmlFor={`active-${agency.id}`} className="text-xs font-medium cursor-pointer">
                          Active Operation
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
