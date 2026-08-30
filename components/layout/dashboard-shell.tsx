"use client";

import { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

interface DashboardShellProps {
  navItems: NavItem[];
  userName: string;
  userEmail: string;
  userRole: string;
  userImage: string | null;
  children: React.ReactNode;
}

export function DashboardShell({
  navItems,
  userName,
  userEmail,
  userRole,
  userImage,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] relative">
      {/* Sidebar Component with Backdrop Overlay */}
      <DashboardSidebar
        navItems={navItems}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        userImage={userImage}
        collapsed={collapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[68px]" : "lg:pl-64",
          "pl-0"
        )}
      >
        <DashboardHeader onToggleSidebar={toggleSidebar} collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
