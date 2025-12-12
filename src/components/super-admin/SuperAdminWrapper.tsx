"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import SuperAdminSidebar from "./SuperAdminSidebar";

interface SuperAdminWrapperProps {
  children: ReactNode;
}

export default function SuperAdminWrapper({ children }: SuperAdminWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/super-admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <SuperAdminSidebar />
      <main className="ml-64 p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
