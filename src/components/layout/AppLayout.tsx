"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import CausePilotChat from "../CausePilotChat";
import Link from "next/link";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { name: string; href?: string }[];
  currentPage?: string;
}

export default function AppLayout({ children, title, breadcrumbs, currentPage = "dashboard" }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-surface-primary/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm">
                  <Link href="/" className="text-muted-foreground hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </Link>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {crumb.href ? (
                        <Link href={crumb.href} className="text-muted-foreground hover:text-white transition-colors">
                          {crumb.name}
                        </Link>
                      ) : (
                        <span className="text-white">{crumb.name}</span>
                      )}
                    </div>
                  ))}
                </nav>
              )}
              
              {/* Title */}
              {title && !breadcrumbs && (
                <h1 className="text-xl font-semibold text-white">{title}</h1>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-surface-secondary transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">Admin</p>
                  <p className="text-xs text-muted-foreground">admin@nucleuscause.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* CausePilot Chat */}
      <CausePilotChat currentPage={currentPage} />
    </div>
  );
}
