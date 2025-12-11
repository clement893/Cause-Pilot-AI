"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  AlertCircle
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
  ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "Actif" },
  PAUSED: { bg: "bg-yellow-100", text: "text-yellow-800", label: "En pause" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-800", label: "Brouillon" },
  ARCHIVED: { bg: "bg-red-100", text: "text-red-800", label: "Archivé" },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automatisations</h1>
              <p className="mt-1 text-sm text-gray-500">
                Créez des workflows automatisés pour engager vos donateurs
              </p>
            </div>
            <Link
              href="/automations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle automatisation
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Automatisations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">Actives</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExecutions}</p>
                <p className="text-sm text-gray-500">Exécutions totales</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Taux de succès</p>
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
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filteredAutomations.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune automatisation
            </h3>
            <p className="text-gray-500 mb-6">
              Créez votre première automatisation pour engager vos donateurs automatiquement
            </p>
            <Link
              href="/automations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
                  className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{trigger.icon}</div>
                      <div>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/automations/${automation.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
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
                          <p className="text-sm text-gray-500 mt-1">
                            {automation.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trigger.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {automation.totalExecutions} exécutions
                          </span>
                          {automation.successfulExecutions > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              {automation.successfulExecutions} réussies
                            </span>
                          )}
                          {automation.failedExecutions > 0 && (
                            <span className="flex items-center gap-1 text-red-600">
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
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
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
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
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
      </div>
    </div>
  );
}
