"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { 
  FileText, Search, Filter, ChevronLeft, ChevronRight, 
  User, Settings, Trash2, Edit, Eye, LogIn, LogOut, 
  Download, Upload, Mail, Shield, Calendar
} from "lucide-react";

interface AuditLog {
  id: string;
  createdAt: string;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  module: string;
  entityType: string;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: "",
    module: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (filters.action) params.append("action", filters.action);
      if (filters.module) params.append("module", filters.module);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <Edit className="w-4 h-4 text-green-400" />;
      case "UPDATE": return <Edit className="w-4 h-4 text-blue-400" />;
      case "DELETE": return <Trash2 className="w-4 h-4 text-red-400" />;
      case "READ": return <Eye className="w-4 h-4 text-gray-400" />;
      case "LOGIN": return <LogIn className="w-4 h-4 text-green-400" />;
      case "LOGOUT": return <LogOut className="w-4 h-4 text-amber-400" />;
      case "EXPORT": return <Download className="w-4 h-4 text-purple-400" />;
      case "IMPORT": return <Upload className="w-4 h-4 text-purple-400" />;
      case "SEND_EMAIL": return <Mail className="w-4 h-4 text-blue-400" />;
      case "PERMISSION_CHANGE": return <Shield className="w-4 h-4 text-amber-400" />;
      case "SETTINGS_CHANGE": return <Settings className="w-4 h-4 text-amber-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "Création",
      UPDATE: "Modification",
      DELETE: "Suppression",
      READ: "Consultation",
      LOGIN: "Connexion",
      LOGOUT: "Déconnexion",
      EXPORT: "Export",
      IMPORT: "Import",
      SEND_EMAIL: "Email envoyé",
      PERMISSION_CHANGE: "Changement de permission",
      SETTINGS_CHANGE: "Changement de paramètre",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-500/20 text-green-400";
      case "UPDATE": return "bg-blue-500/20 text-blue-400";
      case "DELETE": return "bg-red-500/20 text-red-400";
      case "LOGIN": return "bg-green-500/20 text-green-400";
      case "LOGOUT": return "bg-amber-500/20 text-amber-400";
      case "EXPORT":
      case "IMPORT": return "bg-purple-500/20 text-purple-400";
      case "PERMISSION_CHANGE":
      case "SETTINGS_CHANGE": return "bg-amber-500/20 text-amber-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const moduleLabels: Record<string, string> = {
    donors: "Donateurs",
    campaigns: "Campagnes",
    forms: "Formulaires",
    marketing: "Marketing",
    analytics: "Analytics",
    p2p: "P2P",
    copilot: "Copilote IA",
    admin: "Administration",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Link href="/admin" className="hover:text-white">Administration</Link>
              <span>/</span>
              <span className="text-white">Journal d&apos;audit</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Journal d&apos;audit</h1>
            <p className="text-gray-400 mt-1">
              Historique de toutes les actions effectuées dans le système
            </p>
          </div>

          {/* Filters */}
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Toutes les actions</option>
                <option value="CREATE">Création</option>
                <option value="UPDATE">Modification</option>
                <option value="DELETE">Suppression</option>
                <option value="LOGIN">Connexion</option>
                <option value="LOGOUT">Déconnexion</option>
                <option value="EXPORT">Export</option>
                <option value="IMPORT">Import</option>
                <option value="SEND_EMAIL">Email envoyé</option>
                <option value="SETTINGS_CHANGE">Paramètres</option>
              </select>

              <select
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Tous les modules</option>
                <option value="donors">Donateurs</option>
                <option value="campaigns">Campagnes</option>
                <option value="forms">Formulaires</option>
                <option value="marketing">Marketing</option>
                <option value="analytics">Analytics</option>
                <option value="p2p">P2P</option>
                <option value="admin">Administration</option>
              </select>

              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <span className="text-gray-400">à</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => setFilters({ action: "", module: "", startDate: "", endDate: "" })}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Utilisateur</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Action</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Module</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Chargement...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Aucune entrée dans le journal
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm">{log.userName || "Système"}</p>
                              <p className="text-xs text-gray-500">{log.userEmail || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className={`px-2 py-1 text-xs rounded ${getActionColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-400 text-sm">
                            {moduleLabels[log.module] || log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300 text-sm max-w-md truncate">
                            {log.description}
                          </p>
                          {log.entityId && (
                            <p className="text-xs text-gray-500">
                              {log.entityType} #{log.entityId}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <p className="text-sm text-gray-400">
                {total} entrée{total > 1 ? "s" : ""} au total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-gray-400">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
