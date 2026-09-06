"use client";

import { useState, useMemo } from "react";
import { formatDate, cn } from "@/lib/utils";
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  User,
  Activity,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AuditLogItem {
  id: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: any;
  after?: any;
  createdAt: string;
  actor?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface AuditLogsClientProps {
  logs: AuditLogItem[];
}

export default function AuditLogsClient({ logs }: AuditLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Filter logs based on search query and category
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (categoryFilter !== "ALL") {
        const actionPrefix = log.action.split(".")[0]?.toLowerCase();
        const categoryLower = categoryFilter.toLowerCase();
        if (actionPrefix !== categoryLower) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const actorName = log.actor?.name?.toLowerCase() || "";
        const actorEmail = log.actor?.email?.toLowerCase() || "";
        const action = log.action.toLowerCase();
        const resourceType = log.resourceType.toLowerCase();
        const resourceId = log.resourceId?.toLowerCase() || "";

        return (
          actorName.includes(query) ||
          actorEmail.includes(query) ||
          action.includes(query) ||
          resourceType.includes(query) ||
          resourceId.includes(query)
        );
      }

      return true;
    });
  }, [logs, searchQuery, categoryFilter]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, activePage, pageSize]);

  // Reset to page 1 on filter/search change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string | null) => {
    setCategoryFilter(val || "ALL");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: string | null) => {
    setPageSize(Number(val || "10"));
    setCurrentPage(1);
  };

  const getActionBadge = (action: string) => {
    if (action.includes("payout")) {
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
    if (action.includes("user")) {
      return "bg-sky-500/10 text-sky-600 border-sky-500/20";
    }
    if (action.includes("agency")) {
      return "bg-violet-500/10 text-violet-600 border-violet-500/20";
    }
    if (action.includes("booking")) {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Platform Audit Logs
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Recent sensitive platform actions, actor details, resources, and change contexts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border border-slate-200/60 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search actor, action, resource..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 text-xs h-9 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 min-w-[140px]">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 bg-slate-50">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    <SelectItem value="payout">Payouts</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="agency">Agencies</SelectItem>
                    <SelectItem value="booking">Bookings</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-slate-500 font-medium hidden md:inline">Show:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 bg-slate-50 w-16">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ShieldCheck className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">No audit log records found</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || categoryFilter !== "ALL"
                ? "Try adjusting your search query or category filter."
                : "Administrative and sensitive platform actions will be logged here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-white border border-slate-200/60 rounded-lg shadow-sm overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource Target</th>
                    <th className="px-4 py-3">Change Summary</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="h-3 w-3 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[140px]">
                              {log.actor?.name || "System"}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {log.actor?.email || "Automated System"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn("font-mono text-[10px] py-0.5 px-2 font-bold", getActionBadge(log.action))}
                        >
                          {log.action}
                        </Badge>
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="font-semibold text-slate-800">{log.resourceType}</span>
                        {log.resourceId ? (
                          <span className="block font-mono text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5">
                            #{log.resourceId.slice(-8).toUpperCase()}
                          </span>
                        ) : null}
                      </td>

                      {/* Summary */}
                      <td className="px-4 py-3.5 text-slate-500 max-w-[220px]">
                        <p className="truncate font-mono text-[11px] text-slate-600">
                          {JSON.stringify(log.after ?? log.before ?? {})}
                        </p>
                      </td>

                      {/* View Details */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/5 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-500 font-medium">
              Showing{" "}
              <strong className="text-slate-800 font-semibold">
                {Math.min((activePage - 1) * pageSize + 1, filteredLogs.length)}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-800 font-semibold">
                {Math.min(activePage * pageSize, filteredLogs.length)}
              </strong>{" "}
              of <strong className="text-slate-800 font-semibold">{filteredLogs.length}</strong> entries
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                  className="h-8 px-2.5 rounded-md border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (activePage > 3 && activePage < totalPages - 1) {
                        pageNum = activePage - 2 + i;
                      } else if (activePage >= totalPages - 1) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={activePage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "h-8 w-8 p-0 rounded-md text-xs font-bold cursor-pointer",
                          activePage === pageNum
                            ? "bg-primary text-white border-primary hover:bg-primary/90"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                  className="h-8 px-2.5 rounded-md border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Audit Log Modal */}
      {selectedLog && (
        <Dialog open={true} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="glass-card border border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Audit Log Details
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Detailed record payload for transaction log ID #{selectedLog.id.slice(-8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Action</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Resource</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedLog.resourceType} {selectedLog.resourceId ? `(#${selectedLog.resourceId})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Actor</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedLog.actor?.name || "System"}</p>
                  <p className="text-[10px] text-slate-400">{selectedLog.actor?.email}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Logged At</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Payload Data */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-primary" /> Logged Change Payload
                </p>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed max-h-60 border border-slate-800">
                  <pre>{JSON.stringify(selectedLog.after ?? selectedLog.before ?? {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
