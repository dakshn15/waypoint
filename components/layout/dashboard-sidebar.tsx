"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Heart,
  Sparkles,
  User,
  Package,
  Users,
  UserCog,
  Handshake,
  BarChart3,
  Settings,
  ListTodo,
  Building2,
  LogOut,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Map,
  CalendarCheck,
  Heart,
  Sparkles,
  User,
  Package,
  Users,
  UserCog,
  Handshake,
  BarChart3,
  Settings,
  ListTodo,
  Building2,
};

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

interface DashboardSidebarProps {
  navItems: NavItem[];
  userName: string;
  userEmail: string;
  userRole: string;
  userImage: string | null;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  TRAVELER: "Traveler",
  AGENCY: "Agency Owner",
  STAFF: "Staff Member",
  ADMIN: "Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  TRAVELER: "bg-primary/10 text-primary",
  AGENCY: "bg-secondary/10 text-secondary",
  STAFF: "bg-emerald-500/10 text-emerald-600",
  ADMIN: "bg-violet-500/10 text-violet-600",
};

export function DashboardSidebar({
  navItems,
  userName,
  userEmail,
  userRole,
  userImage,
  collapsed: controlledCollapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col h-screen bg-white border-r border-slate-200/80 transition-transform duration-300 shadow-xl lg:shadow-xs",
          // Mobile slide-in behavior vs Desktop visibility
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop width collapse toggle
          isCollapsed ? "lg:w-[68px]" : "lg:w-64",
          "w-64" // standard mobile width
        )}
      >
        {/* Desktop Floating Collapse Button on Border */}
        <button
          type="button"
          onClick={handleToggle}
          className="hidden lg:flex absolute -right-3 top-5 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm items-center justify-center hover:bg-slate-50 z-50 cursor-pointer transition-all hover:shadow-md"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 text-slate-500 transition-transform duration-300",
              isCollapsed && "rotate-180"
            )}
          />
        </button>

        {/* Logo Header */}
        <div
          className={cn(
            "flex items-center px-4 py-4 border-b border-slate-100",
            isCollapsed ? "lg:justify-center justify-between" : "justify-between"
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group" onClick={onCloseMobile}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/30 transition-all">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            {(!isCollapsed || mobileOpen) && (
              <span className="text-lg font-extrabold tracking-tight text-secondary font-display">
                Waypoint
              </span>
            )}
          </Link>

          {/* Mobile Close Icon Button */}
          {mobileOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseMobile}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 lg:hidden rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-3 overflow-y-auto scrollbar-thin">
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group",
                    isActive
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                    isCollapsed && "lg:justify-center lg:px-2"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  {(!isCollapsed || mobileOpen) && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator className="bg-slate-100" />

        {/* User Info & Logout */}
        <div className="p-3">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl",
              isCollapsed && !mobileOpen ? "lg:justify-center" : "bg-slate-50/80"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white shadow-sm">
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-white text-xs font-bold font-display">
                {userName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-800">{userName}</p>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                    ROLE_COLORS[userRole] || ROLE_COLORS.TRAVELER
                  )}
                >
                  {ROLE_LABELS[userRole] || userRole}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={cn(
              "w-full mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer",
              isCollapsed && !mobileOpen ? "lg:px-2 lg:justify-center" : "justify-start"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!isCollapsed || mobileOpen) && <span className="ml-2 text-sm">Log out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
