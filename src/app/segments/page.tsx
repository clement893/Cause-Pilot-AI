"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import {
  Users,
  Plus,
  Filter,
  Trash2,
  Edit,
  Eye,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Layers,
  Zap,
  Brain,
} from "lucide-react";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  type: "STATIC" | "DYNAMIC" | "SMART";
  rules: string | null;
  donorCount: number;
  totalValue: number;
  avgDonation: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/segments");
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (error) {
      console.error("Error fetching segments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "STATIC":
        return <Layers className="w-4 h-4" />;
      case "DYNAMIC":
        return <Zap className="w-4 h-4" />;
      case "SMART":
        return <Brain className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "STATIC":
        return "Statique";
      case "DYNAMIC":
        return "Dynamique";
      case "SMART":
        return "Intelligent";
      default:
        return type;
    }
  };

  // Segments prédéfinis suggérés
  const suggestedSegments = [
    {
      name: "Donateurs majeurs",
      description: "Donateurs ayant donné plus de 1000$",
      rules: { operator: "AND", rules: [{ field: "totalDonated", operator: "greater_than_or_equal", value: 1000 }] },
      color: "#F59E0B",
    },
    {
      name: "Donateurs récurrents",
      description: "Donateurs avec un don récurrent actif",
      rules: { operator: "AND", rules: [{ field: "isRecurring", operator: "is_true", value: true }] },
      color: "#8B5CF6",
    },
    {
      name: "Inactifs 6 mois+",
      description: "Donateurs sans don depuis 6 mois",
      rules: { operator: "AND", rules: [{ field: "lastDonationDate", operator: "not_in_last_days", value: 180 }] },
      color: "#EF4444",
    },
    {
      name: "Nouveaux donateurs",
      description: "Donateurs inscrits ce mois",
      rules: { operator: "AND", rules: [{ field: "createdAt", operator: "in_last_days", value: 30 }] },
      color: "#10B981",
    },
    {
      name: "Donateurs fidèles",
      description: "5+ dons effectués",
      rules: { operator: "AND", rules: [{ field: "donationCount", operator: "greater_than_or_equal", value: 5 }] },
      color: "#3B82F6",
    },
  ];

  const createSuggestedSegment = async (segment: typeof suggestedSegments[0]) => {
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segment.name,
          description: segment.description,
          color: segment.color,
          type: "DYNAMIC",
          rules: segment.rules,
        }),
      });
      if (res.ok) {
        fetchSegments();
      }
    } catch (error) {
      console.error("Error creating segment:", error);
    }
  };

  const deleteSegment = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce segment ?")) return;
    
    try {
      const res = await fetch(`/api/segments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSegments(segments.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting segment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Segments</h1>
            <p className="text-gray-400 mt-1">
              Créez des segments pour cibler vos donateurs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSegments}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <Link
              href="/segments/new"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau segment
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Segments existants */}
            {segments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="bg-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${segment.color}20` }}
                        >
                          <Users className="w-5 h-5" style={{ color: segment.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{segment.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1"
                              style={{
                                backgroundColor: `${segment.color}20`,
                                color: segment.color,
                              }}
                            >
                              {getTypeIcon(segment.type)}
                              {getTypeLabel(segment.type)}
                            </span>
                            {segment.isSystem && (
                              <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                                Système
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {segment.description && (
                      <p className="text-sm text-gray-400 mb-4">{segment.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-2xl font-bold text-white">{segment.donorCount}</p>
                        <p className="text-xs text-gray-400">Donateurs</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-400">
                          {formatCurrency(segment.totalValue)}
                        </p>
                        <p className="text-xs text-gray-400">Total</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-purple-400">
                          {formatCurrency(segment.avgDonation)}
                        </p>
                        <p className="text-xs text-gray-400">Moyenne</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                      <Link
                        href={`/segments/${segment.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </Link>
                      {!segment.isSystem && (
                        <>
                          <Link
                            href={`/segments/${segment.id}/edit`}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors text-sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteSegment(segment.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-12 text-center mb-8">
                <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Aucun segment créé
                </h3>
                <p className="text-gray-400 mb-6">
                  Créez des segments pour cibler vos communications et actions
                </p>
                <Link
                  href="/segments/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Créer mon premier segment
                </Link>
              </div>
            )}

            {/* Segments suggérés */}
            <div className="bg-gradient-to-br from-slate-900 to-purple-900/30 rounded-xl border border-purple-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Segments suggérés
                  </h2>
                  <p className="text-sm text-gray-400">
                    Cliquez pour créer automatiquement
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {suggestedSegments.map((segment, index) => {
                  const exists = segments.some(s => s.name === segment.name);
                  return (
                    <button
                      key={index}
                      onClick={() => !exists && createSuggestedSegment(segment)}
                      disabled={exists}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        exists
                          ? "bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed"
                          : "bg-slate-800/50 border-slate-700 hover:border-purple-500 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${segment.color}20` }}
                        >
                          <Users className="w-4 h-4" style={{ color: segment.color }} />
                        </div>
                        {exists ? (
                          <span className="text-xs text-green-400">Créé</span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <p className="font-medium text-white text-sm">{segment.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{segment.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
