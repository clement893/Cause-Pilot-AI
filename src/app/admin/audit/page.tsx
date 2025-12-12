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
      case "CREATE": return <Edit className="w-4 h-4 text-success-light" />;
      case "UPDATE": return <Edit className="w-4 h-4 text-info-light" />;
      case "DELETE": return <Trash2 className="w-4 h-4 text-error-light" />;
      case "READ": return <Eye className="w-4 h-4 text-muted-foreground" />;
      case "LOGIN": return <LogIn className="w-4 h-4 text-success-light" />;
      case "LOGOUT": return <LogOut className="w-4 h-4 text-warning" />;
      case "EXPORT": return <Download className="w-4 h-4 text-brand-light" />;
      case "IMPORT": return <Upload className="w-4 h-4 text-brand-light" />;
      case "SEND_EMAIL": return <Mail className="w-4 h-4 text-info-light" />;
      case "PERMISSION_CHANGE": return <Shield className="w-4 h-4 text-warning" />;
      case "SETTINGS_CHANGE": return <Settings className="w-4 h-4 text-warning" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
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
      case "CREATE": return "bg-success/20 text-success-light";
      case "UPDATE": return "bg-info/20 text-info-light";
      case "DELETE": return "bg-error/20 text-error-light";
      case "LOGIN": return "bg-success/20 text-success-light";
      case "LOGOUT": return "bg-amber-500/20 text-warning";
      case "EXPORT":
      case "IMPORT": return "bg-brand/20 text-brand-light";
      case "PERMISSION_CHANGE":
      case "SETTINGS_CHANGE": return "bg-amber-500/20 text-warning";
      default: return "bg-muted/20 text-muted-foreground";
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
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Link href="/admin" className="hover:text-white">Administration</Link>
              <span>/</span>
              <span className="text-white">Journal d&apos;audit</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Journal d&apos;audit</h1>
            <p className="text-muted-foreground mt-1">
              Historique de toutes les actions effectuées dans le système
            </p>
          </div>

          {/* Filters */}
          <div className="bg-surface-primary rounded-xl p-4 border border-border mb-6">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white focus:outline-none focus:border-brand"
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
                className="px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white focus:outline-none focus:border-brand"
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
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white focus:outline-none focus:border-brand"
                />
                <span className="text-muted-foreground">à</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white focus:outline-none focus:border-brand"
                />
              </div>

              <button
                onClick={() => setFilters({ action: "", module: "", startDate: "", endDate: "" })}
                className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Utilisateur</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Module</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Chargement...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Aucune entrée dans le journal
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-surface-secondary/50">
                        <td className="px-6 py-4 text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-brand-light" />
                            </div>
                            <div>
                              <p className="text-white text-sm">{log.userName || "Système"}</p>
                              <p className="text-xs text-text-tertiary">{log.userEmail || "-"}</p>
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
                          <span className="text-muted-foreground text-sm">
                            {moduleLabels[log.module] || log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-foreground text-sm max-w-md truncate">
                            {log.description}
                          </p>
                          {log.entityId && (
                            <p className="text-xs text-text-tertiary">
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {total} entrée{total > 1 ? "s" : ""} au total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 text-muted-foreground hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-muted-foreground hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
