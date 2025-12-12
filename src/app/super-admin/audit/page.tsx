"use client";

import { useEffect, useState } from "react";
import SuperAdminWrapper from "@/components/super-admin/SuperAdminWrapper";
import {
  FileText,
  Search,
  Filter,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Clock,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  adminUser: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityTypeFilter, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (actionFilter) params.append("action", actionFilter);
      if (entityTypeFilter) params.append("entityType", entityTypeFilter);

      const response = await fetch(`/api/super-admin/audit?${params}`);
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case "UPDATE":
        return <Activity className="w-4 h-4 text-blue-400" />;
      case "DELETE":
        return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      case "LOGIN":
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-500/20 text-green-300";
      case "UPDATE": return "bg-blue-500/20 text-blue-300";
      case "DELETE": return "bg-red-500/20 text-red-300";
      case "LOGIN": return "bg-purple-500/20 text-purple-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SuperAdminWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1">
            Historique de toutes les actions effectuées sur la plateforme
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Toutes les actions</option>
            <option value="CREATE">Création</option>
            <option value="UPDATE">Modification</option>
            <option value="DELETE">Suppression</option>
            <option value="LOGIN">Connexion</option>
          </select>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tous les types</option>
            <option value="Organization">Organisation</option>
            <option value="AdminUser">Utilisateur Admin</option>
            <option value="Session">Session</option>
          </select>
        </div>

        {/* Logs List */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucun log trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-600 text-slate-300">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-white mt-1">{log.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        {log.adminUser && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {log.adminUser.name || log.adminUser.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.entityId && (
                          <span className="text-slate-500">
                            ID: {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">
                            Voir les détails
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
              {pagination.total} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminWrapper>
  );
}
