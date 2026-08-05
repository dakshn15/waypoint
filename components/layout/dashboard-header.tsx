"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, CalendarCheck, DollarSign, Map, Sparkles, Info, Check, X } from "lucide-react";
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

export function DashboardHeader() {
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
        return <CalendarCheck className="h-4 w-4 text-[#769ABC]" />;
      case "PAYMENT":
        return <DollarSign className="h-4 w-4 text-[#769ABC]" />;
      case "TRIP":
        return <Map className="h-4 w-4 text-[#1A3B5A]" />;
      case "PROMOTION":
        return <Sparkles className="h-4 w-4 text-[#E46F44]" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="pl-9 pr-20 bg-slate-100/70 border-0 focus-visible:ring-[#769ABC] text-sm rounded-lg text-slate-900 placeholder:text-slate-500"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 bg-[#769ABC] hover:bg-[#769ABC]/90 text-white rounded-md text-xs px-3 cursor-pointer"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 w-9 relative flex items-center justify-center rounded-full hover:bg-slate-100 border border-slate-200 focus:outline-none transition-colors cursor-pointer">
            <Bell className="h-4 w-4 text-slate-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] font-bold bg-[#E46F44] border-white border-2 text-white">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 bg-white border border-slate-200 shadow-xl rounded-xl">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-[#769ABC] hover:underline flex items-center gap-1 font-medium bg-transparent border-0 cursor-pointer"
                >
                  <Check className="h-3 w-3" /> Mark all as read
                </button>
              )}
            </div>
            <DropdownMenuSeparator className="my-1" />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No notifications yet.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer text-left ${
                      notif.read ? "opacity-75" : "bg-slate-50"
                    }`}
                  >
                    <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-medium truncate ${
                          notif.read ? "text-slate-600" : "text-slate-900"
                        }`}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E46F44]" />
                          )}
                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="h-5 w-5 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer transition-colors"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed break-words">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {formatTime(notif.createdAt)}
                      </p>
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

