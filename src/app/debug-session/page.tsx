"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface DebugData {
  session?: {
    userId?: string;
    email?: string | null;
    role?: string;
    status?: string;
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
  };
  adminUser?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
  };
  organizationAccesses?: Array<{
    id: string;
    organizationId: string;
    Organization: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
  allOrganizations?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  debug?: {
    hasOrganizationInSession: boolean;
    hasOrganizationAccesses: boolean;
    totalOrganizations: number;
  };
}

export default function DebugSessionPage() {
  const { data: session } = useSession();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebug = async () => {
      try {
        const response = await fetch("/api/debug/session", {
          credentials: 'include',
        });
        const data = await response.json() as DebugData;
        setDebugData(data);
      } catch (error) {
        console.error("Error fetching debug data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDebug();
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white">Veuillez vous connecter</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Debug Session</h1>
        
        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Session Info</h2>
            <pre className="bg-slate-900 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugData?.session, null, 2)}
            </pre>
          </div>

          {/* Admin User Info */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Admin User</h2>
            <pre className="bg-slate-900 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugData?.adminUser, null, 2)}
            </pre>
          </div>

          {/* Organization Accesses */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Organization Accesses ({debugData?.organizationAccesses?.length || 0})
            </h2>
            {debugData?.organizationAccesses && debugData.organizationAccesses.length > 0 ? (
              <pre className="bg-slate-900 p-4 rounded text-sm text-gray-300 overflow-auto">
                {JSON.stringify(debugData.organizationAccesses, null, 2)}
              </pre>
            ) : (
              <p className="text-red-400">⚠️ Aucun accès aux organisations trouvé!</p>
            )}
          </div>

          {/* All Organizations */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              All Organizations ({debugData?.allOrganizations?.length || 0})
            </h2>
            <pre className="bg-slate-900 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(debugData?.allOrganizations, null, 2)}
            </pre>
          </div>

          {/* Debug Summary */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Debug Summary</h2>
            <div className="space-y-2 text-sm">
              <div className={`p-3 rounded ${debugData?.debug?.hasOrganizationInSession ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                Has Organization in Session: {debugData?.debug?.hasOrganizationInSession ? '✅ OUI' : '❌ NON'}
              </div>
              <div className={`p-3 rounded ${debugData?.debug?.hasOrganizationAccesses ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                Has Organization Accesses: {debugData?.debug?.hasOrganizationAccesses ? '✅ OUI' : '❌ NON'}
              </div>
              <div className="p-3 rounded bg-blue-900/30 text-blue-300">
                Total Organizations: {debugData?.debug?.totalOrganizations || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
