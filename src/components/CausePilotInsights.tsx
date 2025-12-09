"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  Users,
  ChevronRight,
  RefreshCw,
  Lightbulb,
  Zap,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Brain,
} from "lucide-react";

interface AtRiskDonor {
  id: string;
  firstName: string;
  lastName: string;
  totalDonated: number;
  daysSinceLastDonation: number;
  riskScore: number;
  riskLevel: string;
  suggestedAction: string;
}

interface UpgradeCandidate {
  id: string;
  firstName: string;
  lastName: string;
  totalDonated: number;
  avgDonation: number;
  suggestedRecurringAmount: number;
  potentialAnnualValue: number;
  suggestedAction: string;
}

interface CampaignSuggestion {
  type: string;
  title: string;
  description: string;
  priority: string;
  potentialImpact: string;
}

interface PredictionsData {
  predictions: {
    atRiskDonors: AtRiskDonor[];
    upgradeCandidates: UpgradeCandidate[];
  };
  timing: {
    bestDays: { day: string; count: number; avgAmount: number }[];
    bestHours: { hour: string; count: number; avgAmount: number }[];
  };
  recommendations: {
    suggestedAmounts: number[];
    campaignSuggestions: CampaignSuggestion[];
  };
  insights: {
    healthScore: number;
    recurringRate: number;
    retentionRate: number;
    avgDonation: number;
    medianDonation: number;
  };
}

export default function CausePilotInsights() {
  const [data, setData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"risks" | "opportunities" | "timing" | "campaigns">("risks");

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/causepilot/predictions");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-red-500/20 text-red-400";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-green-500/20 text-green-400";
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-purple-900/30 rounded-xl border border-purple-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CausePilot Insights</h2>
            <p className="text-sm text-gray-400">Analyse en cours...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-purple-900/30 rounded-xl border border-purple-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CausePilot Insights</h2>
            <p className="text-sm text-gray-400">Prédictions et suggestions IA</p>
          </div>
        </div>
        <button
          onClick={fetchPredictions}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Health Score */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className={`text-3xl font-bold ${getHealthScoreColor(data.insights.healthScore)}`}>
            {data.insights.healthScore}
          </p>
          <p className="text-xs text-gray-400 mt-1">Score santé</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {data.insights.recurringRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Taux récurrent</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {data.insights.retentionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Rétention</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(data.insights.avgDonation)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Don moyen</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab("risks")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "risks"
              ? "bg-red-500/20 text-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Risques ({data.predictions.atRiskDonors.length})
        </button>
        <button
          onClick={() => setActiveTab("opportunities")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "opportunities"
              ? "bg-green-500/20 text-green-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Opportunités ({data.predictions.upgradeCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab("timing")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "timing"
              ? "bg-blue-500/20 text-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          Timing optimal
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "campaigns"
              ? "bg-purple-500/20 text-purple-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Target className="w-4 h-4" />
          Campagnes suggérées
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activeTab === "risks" && (
          <>
            {data.predictions.atRiskDonors.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-gray-400">Aucun donateur à risque détecté</p>
              </div>
            ) : (
              data.predictions.atRiskDonors.map((donor) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {donor.firstName[0]}{donor.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {donor.firstName} {donor.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(donor.totalDonated)} • Inactif depuis {donor.daysSinceLastDonation}j
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(donor.riskLevel)}`}>
                      Risque {donor.riskScore}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </Link>
              ))
            )}
          </>
        )}

        {activeTab === "opportunities" && (
          <>
            {data.predictions.upgradeCandidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Aucune opportunité d'upgrade détectée</p>
              </div>
            ) : (
              data.predictions.upgradeCandidates.map((donor) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {donor.firstName} {donor.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Don moyen: {formatCurrency(donor.avgDonation)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      {formatCurrency(donor.suggestedRecurringAmount)}/mois
                    </p>
                    <p className="text-xs text-gray-400">
                      = {formatCurrency(donor.potentialAnnualValue)}/an
                    </p>
                  </div>
                </Link>
              ))
            )}
          </>
        )}

        {activeTab === "timing" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h4 className="font-medium text-white">Meilleurs jours</h4>
              </div>
              <div className="space-y-2">
                {data.timing.bestDays.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-xs text-blue-400">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{day.day}</span>
                    </div>
                    <span className="text-sm text-gray-400">{day.count} dons</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-purple-400" />
                <h4 className="font-medium text-white">Meilleures heures</h4>
              </div>
              <div className="space-y-2">
                {data.timing.bestHours.map((hour, index) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-xs text-purple-400">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{hour.hour}</span>
                    </div>
                    <span className="text-sm text-gray-400">{hour.count} dons</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-green-400" />
                <h4 className="font-medium text-white">Montants suggérés</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.recommendations.suggestedAmounts.map((amount) => (
                  <span
                    key={amount}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                  >
                    {formatCurrency(amount)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "campaigns" && (
          <>
            {data.recommendations.campaignSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Aucune campagne suggérée pour le moment</p>
              </div>
            ) : (
              data.recommendations.campaignSuggestions.map((campaign, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 rounded-lg border-l-4"
                  style={{
                    borderColor: campaign.priority === "HIGH" ? "#EF4444" : "#8B5CF6",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <h4 className="font-medium text-white">{campaign.title}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        campaign.priority === "HIGH"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {campaign.priority === "HIGH" ? "Prioritaire" : "Suggéré"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{campaign.description}</p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Zap className="w-3 h-3" />
                    {campaign.potentialImpact}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <Link
          href="/causepilot"
          className="flex items-center justify-center gap-2 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Discuter avec CausePilot
        </Link>
      </div>
    </div>
  );
}
