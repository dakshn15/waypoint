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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export function DashboardSidebar({ navItems, userName, userEmail, userRole, userImage }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r border-border transition-all duration-300 sticky top-0 relative",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Floating Collapse Button on Border */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 h-6 w-6 rounded-full border border-border bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 z-50 cursor-pointer transition-transform"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", collapsed && "rotate-180")} />
      </button>

      {/* Logo Header */}
      <div className={cn("h-16 flex items-center px-4 border-b border-border", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#769ABC] to-[#1A3B5A] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Waypoint</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#769ABC]/10 text-[#769ABC]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Info + Logout */}
      <div className="p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            {userImage && <AvatarImage src={userImage} alt={userName} />}
            <AvatarFallback className="bg-[var(--waypoint-navy)] text-white text-xs">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userRole}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full mt-2 text-muted-foreground hover:text-destructive",
            collapsed ? "px-2 justify-center" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Log out</span>}
        </Button>
      </div>
    </aside>
  );
}
