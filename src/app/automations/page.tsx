"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  MoreVertical,
  Zap,
  Mail,
  Clock,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "ARCHIVED";
  triggerType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutedAt: string | null;
  createdAt: string;
  _count: {
    executions: number;
  };
}

const TRIGGER_LABELS: Record<string, { label: string; icon: string }> = {
  NEW_DONOR: { label: "Nouveau donateur", icon: "👋" },
  POST_DONATION: { label: "Après un don", icon: "💝" },
  DONATION_ANNIVERSARY: { label: "Anniversaire de don", icon: "🎂" },
  DONOR_BIRTHDAY: { label: "Anniversaire donateur", icon: "🎈" },
  INACTIVE_DONOR: { label: "Donateur inactif", icon: "🔄" },
  CAMPAIGN_GOAL_REACHED: { label: "Objectif atteint", icon: "🎯" },
  RECURRING_CANCELLED: { label: "Récurrent annulé", icon: "⚠️" },
  UPGRADE_OPPORTUNITY: { label: "Opportunité upgrade", icon: "⬆️" },
  MANUAL: { label: "Manuel", icon: "👆" },
  SCHEDULED: { label: "Planifié", icon: "📅" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "bg-success/20", text: "text-success-light", label: "Actif" },
  PAUSED: { bg: "bg-warning/20", text: "text-yellow-400", label: "En pause" },
  DRAFT: { bg: "bg-muted/20", text: "text-slate-400", label: "Brouillon" },
  ARCHIVED: { bg: "bg-error/20", text: "text-error-light", label: "Archivé" },
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch("/api/automations");
      if (response.ok) {
        const data = await response.json();
        setAutomations(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchAutomations();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette automatisation ?")) return;
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchAutomations();
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const filteredAutomations = automations.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === "ACTIVE").length,
    totalExecutions: automations.reduce((sum, a) => sum + a.totalExecutions, 0),
    successRate: automations.reduce((sum, a) => sum + a.successfulExecutions, 0) /
      Math.max(automations.reduce((sum, a) => sum + a.totalExecutions, 0), 1) * 100,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Automatisations</h1>
            <p className="text-muted-foreground mt-1">
              Créez des workflows automatisés pour engager vos donateurs
            </p>
          </div>
          <Link
            href="/automations/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle automatisation
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-primary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand/20 rounded-lg">
                <Zap className="w-6 h-6 text-brand-light" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Automatisations</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-primary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/20 rounded-lg">
                <Play className="w-6 h-6 text-success-light" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Actives</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-primary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-info/20 rounded-lg">
                <Mail className="w-6 h-6 text-info-light" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalExecutions}</p>
                <p className="text-sm text-muted-foreground">Exécutions totales</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-primary rounded-xl p-6 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.successRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "Toutes" },
            { value: "ACTIVE", label: "Actives" },
            { value: "PAUSED", label: "En pause" },
            { value: "DRAFT", label: "Brouillons" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-brand text-white"
                  : "bg-surface-secondary text-foreground hover:bg-surface-tertiary border border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filteredAutomations.length === 0 ? (
          <div className="bg-surface-primary rounded-xl border border-border p-12 text-center">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Aucune automatisation
            </h3>
            <p className="text-muted-foreground mb-6">
              Créez votre première automatisation pour engager vos donateurs automatiquement
            </p>
            <Link
              href="/automations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark"
            >
              <Plus className="w-5 h-5" />
              Créer une automatisation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAutomations.map((automation) => {
              const trigger = TRIGGER_LABELS[automation.triggerType] || {
                label: automation.triggerType,
                icon: "⚡",
              };
              const statusStyle = STATUS_STYLES[automation.status];

              return (
                <div
                  key={automation.id}
                  className="bg-surface-primary rounded-xl border border-border p-6 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{trigger.icon}</div>
                      <div>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/automations/${automation.id}`}
                            className="text-lg font-semibold text-white hover:text-brand-light transition-colors"
                          >
                            {automation.name}
                          </Link>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                        {automation.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {automation.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trigger.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {automation.totalExecutions} exécutions
                          </span>
                          {automation.successfulExecutions > 0 && (
                            <span className="flex items-center gap-1 text-success-light">
                              <CheckCircle className="w-4 h-4" />
                              {automation.successfulExecutions} réussies
                            </span>
                          )}
                          {automation.failedExecutions > 0 && (
                            <span className="flex items-center gap-1 text-error-light">
                              <XCircle className="w-4 h-4" />
                              {automation.failedExecutions} échouées
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {automation.status !== "DRAFT" && (
                        <button
                          onClick={() => toggleStatus(automation.id, automation.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            automation.status === "ACTIVE"
                              ? "bg-warning/20 text-yellow-400 hover:bg-warning/30"
                              : "bg-success/20 text-success-light hover:bg-success/30"
                          }`}
                          title={automation.status === "ACTIVE" ? "Mettre en pause" : "Activer"}
                        >
                          {automation.status === "ACTIVE" ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <Link
                        href={`/automations/${automation.id}/edit`}
                        className="p-2 bg-surface-secondary text-muted-foreground rounded-lg hover:bg-surface-tertiary hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        className="p-2 bg-error/20 text-error-light rounded-lg hover:bg-error/30 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
