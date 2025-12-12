"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    href: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Organisations",
    href: "/super-admin/organizations",
    icon: Building2,
  },
  {
    title: "Utilisateurs",
    href: "/super-admin/users",
    icon: Users,
  },
  {
    title: "Audit Logs",
    href: "/super-admin/audit",
    icon: FileText,
  },
  {
    title: "Paramètres",
    href: "/super-admin/settings",
    icon: Settings,
  },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-white truncate">Super Admin</h1>
              <p className="text-xs text-slate-400 truncate">Cause Pilot AI</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/super-admin" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-800">
        {session?.user && (
          <div className={cn("mb-3", collapsed ? "text-center" : "")}>
            {!collapsed && (
              <>
                <p className="text-sm font-medium text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {session.user.email}
                </p>
              </>
            )}
            {collapsed && (
              <div className="w-8 h-8 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-purple-300">
                  {session.user.name?.charAt(0) || "A"}
                </span>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={() => signOut({ callbackUrl: "/super-admin/login" })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
