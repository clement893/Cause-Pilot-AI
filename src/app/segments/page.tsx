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
  AlertTriangle,
  TrendingUp,
  Star,
  UserPlus,
  Trophy,
  Target,
  BarChart3,
  Mail,
  Tag,
  CheckCircle,
  Loader2,
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

interface SmartSegment {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  donorCount: number;
  totalValue: number;
  avgDonation: number;
  donors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    totalDonations: number;
    donationCount: number;
    lastDonationDate: string | null;
    potentialScore: number | null;
    churnRiskScore: number | null;
  }>;
}

const iconMap: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Star: <Star className="w-5 h-5" />,
  UserPlus: <UserPlus className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  RefreshCw: <RefreshCw className="w-5 h-5" />,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  amber: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [smartSegments, setSmartSegments] = useState<SmartSegment[]>([]);
  const [smartStats, setSmartStats] = useState<{ totalDonors: number; segmentedDonors: number; totalSegments: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"smart" | "manual">("smart");
  const [selectedSegment, setSelectedSegment] = useState<SmartSegment | null>(null);
  const [taggingDonors, setTaggingDonors] = useState<string[]>([]);
  const [tagLoading, setTagLoading] = useState(false);

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/segments");
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  const fetchSmartSegments = async () => {
    try {
      const res = await fetch("/api/segments/smart");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSmartSegments(data.segments);
          setSmartStats(data.stats);
        }
      }
    } catch (error) {
      console.error("Error fetching smart segments:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSegments(), fetchSmartSegments()]);
      setLoading(false);
    };
    loadData();
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

  const handleTagDonors = async (segmentId: string, donorIds: string[]) => {
    try {
      setTagLoading(true);
      const response = await fetch("/api/segments/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId,
          donorIds,
          action: "add",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTaggingDonors(prev => [...prev, ...donorIds]);
        alert(`${data.updatedCount} donateurs ont été tagués avec succès !`);
      }
    } catch (error) {
      console.error("Error tagging donors:", error);
      alert("Erreur lors du tagging des donateurs");
    } finally {
      setTagLoading(false);
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
              Segments intelligents et manuels pour cibler vos donateurs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchSegments(); fetchSmartSegments(); }}
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

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("smart")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "smart"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-gray-400 hover:bg-slate-700"
            }`}
          >
            <Brain className="w-4 h-4" />
            Segments Intelligents
            {smartSegments.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-500/30 rounded-full text-xs">
                {smartSegments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "manual"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-gray-400 hover:bg-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            Segments Manuels
            {segments.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-600/50 rounded-full text-xs">
                {segments.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === "smart" ? (
          <>
            {/* Smart Segments Stats */}
            {smartStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Donateurs</p>
                      <p className="text-2xl font-bold text-white">{smartStats.totalDonors}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Donateurs Segmentés</p>
                      <p className="text-2xl font-bold text-white">{smartStats.segmentedDonors}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Segments Actifs</p>
                      <p className="text-2xl font-bold text-white">{smartStats.totalSegments}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Segments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {smartSegments.map((segment) => {
                const colors = colorMap[segment.color] || colorMap.blue;
                return (
                  <div
                    key={segment.id}
                    className={`bg-slate-900 border ${colors.border} rounded-xl overflow-hidden hover:border-opacity-60 transition-all cursor-pointer`}
                    onClick={() => setSelectedSegment(selectedSegment?.id === segment.id ? null : segment)}
                  >
                    {/* Segment Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 ${colors.bg} rounded-xl ${colors.text}`}>
                            {iconMap[segment.icon]}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{segment.name}</h3>
                            <p className="text-sm text-gray-400">{segment.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            IA
                          </span>
                          <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${selectedSegment?.id === segment.id ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      {/* Segment Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Donateurs</p>
                          <p className="text-xl font-bold text-white">{segment.donorCount}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Valeur Totale</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(segment.totalValue)}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Don Moyen</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(segment.avgDonation)}</p>
                        </div>
                      </div>

                      {/* Criteria */}
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Critères de segmentation</p>
                        <p className="text-sm text-gray-300">{segment.criteria}</p>
                      </div>
                    </div>

                    {/* Expanded Donor List */}
                    {selectedSegment?.id === segment.id && (
                      <div className="border-t border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-300">
                            Donateurs dans ce segment ({segment.donors.length} affichés)
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagDonors(segment.id, segment.donors.map(d => d.id));
                              }}
                              disabled={tagLoading}
                              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                            >
                              {tagLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Tag className="w-4 h-4" />
                              )}
                              Taguer tous
                            </button>
                            <Link
                              href={`/marketing/campaigns/new?segment=${segment.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              Créer campagne
                            </Link>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {segment.donors.map((donor) => (
                            <Link
                              key={donor.id}
                              href={`/donors/${donor.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {donor.firstName[0]}{donor.lastName[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {donor.firstName} {donor.lastName}
                                    {taggingDonors.includes(donor.id) && (
                                      <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" />
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-400">{donor.email || "Pas d'email"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <p className="text-sm font-medium text-white">{formatCurrency(donor.totalDonations)}</p>
                                  <p className="text-xs text-gray-400">{donor.donationCount} dons</p>
                                </div>
                                {donor.potentialScore && (
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    donor.potentialScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                                    donor.potentialScore >= 40 ? "bg-amber-500/20 text-amber-400" :
                                    "bg-slate-500/20 text-slate-400"
                                  }`}>
                                    {donor.potentialScore}
                                  </div>
                                )}
                                {donor.churnRiskScore && (
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    donor.churnRiskScore >= 70 ? "bg-red-500/20 text-red-400" :
                                    donor.churnRiskScore >= 40 ? "bg-orange-500/20 text-orange-400" :
                                    "bg-green-500/20 text-green-400"
                                  }`}>
                                    {donor.churnRiskScore}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>

                        {segment.donorCount > 20 && (
                          <p className="text-xs text-gray-500 mt-3 text-center">
                            {segment.donorCount - 20} donateurs supplémentaires non affichés
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions recommandées */}
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Actions recommandées par l&apos;IA
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {smartSegments.find(s => s.id === "churn-risk")?.donorCount ? (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Priorité haute</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {smartSegments.find(s => s.id === "churn-risk")?.donorCount} donateurs à risque de churn. 
                      Lancez une campagne de réengagement.
                    </p>
                  </div>
                ) : null}
                {smartSegments.find(s => s.id === "major-gift-potential")?.donorCount ? (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">Opportunité</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {smartSegments.find(s => s.id === "major-gift-potential")?.donorCount} donateurs majeurs potentiels. 
                      Planifiez des rencontres personnalisées.
                    </p>
                  </div>
                ) : null}
                {smartSegments.find(s => s.id === "new-to-retain")?.donorCount ? (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-sm font-medium">Fidélisation</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {smartSegments.find(s => s.id === "new-to-retain")?.donorCount} nouveaux donateurs à fidéliser. 
                      Envoyez une série de bienvenue.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Manual Segments */}
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
                  Aucun segment manuel créé
                </h3>
                <p className="text-gray-400 mb-6">
                  Créez des segments manuels pour cibler vos communications et actions
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
