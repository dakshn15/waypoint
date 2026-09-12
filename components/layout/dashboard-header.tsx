"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, CalendarCheck, DollarSign, Map, Sparkles, Info, Check, X, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "BOOKING" | "PAYMENT" | "TRIP" | "SYSTEM" | "PROMOTION";
  read: boolean;
  createdAt: string;
}

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
  collapsed?: boolean;
}

export function DashboardHeader({ onToggleSidebar, collapsed }: DashboardHeaderProps = {}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/packages?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
            setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }
    fetchNotifications();
  }, []);

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }

  // Mark a single notification as read
  async function markAsRead(id: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  // Delete notification
  async function deleteNotification(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === id);
          const wasUnread = target ? !target.read : false;
          if (wasUnread) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== id);
        });
        toast.success("Notification removed");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }

  // Helper to format date
  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }

  // Get matching icon for notification type
  function getIcon(type: Notification["type"]) {
    switch (type) {
      case "BOOKING":
        return <CalendarCheck className="h-4 w-4 text-secondary" />;
      case "PAYMENT":
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case "TRIP":
        return <Map className="h-4 w-4 text-secondary" />;
      case "PROMOTION":
        return <Sparkles className="h-4 w-4 text-primary" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  }

  return (
    <header className="py-3.5 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 gap-3">
      {/* Search & Sidebar Toggle */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onToggleSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <PanelLeft className="h-5 w-5 text-slate-600" />
          </Button>
        )}

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="pl-9 pr-20"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 w-9 relative flex items-center justify-center rounded-lg hover:bg-slate-100 border border-slate-200/80 focus:outline-none transition-all cursor-pointer shrink-0">
            <Bell className="h-4 w-4 text-slate-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] p-0 flex items-center justify-center text-[9px] font-bold bg-primary border-white border-2 text-white rounded-full">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[calc(100vw-32px)] sm:w-80 max-w-[360px] p-2 bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-900/10 rounded-lg overflow-visible z-[60]"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary-dark flex items-center gap-1 font-semibold bg-transparent border-0 cursor-pointer transition-colors"
                >
                  <Check className="h-3 w-3" /> Mark all as read
                </button>
              )}
            </div>
            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-1.5 p-0.5 pb-3 pr-1 scrollbar-thin">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-lg transition-all cursor-pointer text-left border ${
                      notif.read
                        ? "bg-white border-slate-100/80 opacity-75 hover:bg-slate-50/80"
                        : "bg-slate-50/90 border-slate-200/80 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="mt-0.5 rounded-md bg-white border border-slate-200/70 p-2 shrink-0 shadow-xs flex items-center justify-center">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5 min-w-0">
                        <p
                          className={`text-xs font-bold leading-snug line-clamp-1 flex-1 min-w-0 ${
                            notif.read ? "text-slate-600" : "text-slate-900"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="h-5 w-5 rounded-md hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors bg-transparent border-0 cursor-pointer"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

