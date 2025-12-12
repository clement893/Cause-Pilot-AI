"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
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
    if (score >= 70) return "text-success-light";
    if (score >= 50) return "text-warning";
    return "text-error-light";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-error/20 text-error-light";
      case "MEDIUM":
        return "bg-amber-500/20 text-warning";
      default:
        return "bg-success/20 text-success-light";
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-purple-900/30 rounded-xl border border-purple-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-brand-light animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CausePilot Insights</h2>
            <p className="text-sm text-muted-foreground">Analyse en cours...</p>
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
          <div className="w-10 h-10 bg-brand/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-brand-light" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CausePilot Insights</h2>
            <p className="text-sm text-muted-foreground">Prédictions et suggestions IA</p>
          </div>
        </div>
        <button
          onClick={fetchPredictions}
          className="p-2 bg-surface-secondary border border-border rounded-lg hover:bg-surface-tertiary transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Health Score */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
          <p className={`text-3xl font-bold ${getHealthScoreColor(data.insights.healthScore)}`}>
            {data.insights.healthScore}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Score santé</p>
        </div>
        <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-brand-light">
            {data.insights.recurringRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Taux récurrent</p>
        </div>
        <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-info-light">
            {data.insights.retentionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Rétention</p>
        </div>
        <div className="bg-surface-secondary/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-success-light">
            {formatCurrency(data.insights.avgDonation)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Don moyen</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("risks")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "risks"
              ? "bg-error/20 text-error-light"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Risques ({data.predictions.atRiskDonors.length})
        </button>
        <button
          onClick={() => setActiveTab("opportunities")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "opportunities"
              ? "bg-success/20 text-success-light"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Opportunités ({data.predictions.upgradeCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab("timing")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "timing"
              ? "bg-info/20 text-info-light"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          Timing optimal
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === "campaigns"
              ? "bg-brand/20 text-brand-light"
              : "text-muted-foreground hover:text-white"
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
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-success-light" />
                </div>
                <p className="text-muted-foreground">Aucun donateur à risque détecté</p>
              </div>
            ) : (
              data.predictions.atRiskDonors.map((donor) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-tertiary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {donor.firstName[0]}{donor.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {donor.firstName} {donor.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(donor.totalDonated)} • Inactif depuis {donor.daysSinceLastDonation}j
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(donor.riskLevel)}`}>
                      Risque {donor.riskScore}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
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
                <p className="text-muted-foreground">Aucune opportunité d&apos;upgrade détectée</p>
              </div>
            ) : (
              data.predictions.upgradeCandidates.map((donor) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-success-light" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {donor.firstName} {donor.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Don moyen: {formatCurrency(donor.avgDonation)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-success-light">
                      {formatCurrency(donor.suggestedRecurringAmount)}/mois
                    </p>
                    <p className="text-xs text-muted-foreground">
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
            <div className="bg-surface-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-info-light" />
                <h4 className="font-medium text-white">Meilleurs jours</h4>
              </div>
              <div className="space-y-2">
                {data.timing.bestDays.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-info/20 rounded-full flex items-center justify-center text-xs text-info-light">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{day.day}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{day.count} dons</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-brand-light" />
                <h4 className="font-medium text-white">Meilleures heures</h4>
              </div>
              <div className="space-y-2">
                {data.timing.bestHours.map((hour, index) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-brand/20 rounded-full flex items-center justify-center text-xs text-brand-light">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{hour.hour}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{hour.count} dons</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 bg-surface-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-success-light" />
                <h4 className="font-medium text-white">Montants suggérés</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.recommendations.suggestedAmounts.map((amount) => (
                  <span
                    key={amount}
                    className="px-3 py-1 bg-success/20 text-success-light rounded-full text-sm"
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
                <p className="text-muted-foreground">Aucune campagne suggérée pour le moment</p>
              </div>
            ) : (
              data.recommendations.campaignSuggestions.map((campaign, index) => (
                <div
                  key={index}
                  className="p-4 bg-surface-secondary/50 rounded-lg border-l-4"
                  style={{
                    borderColor: campaign.priority === "HIGH" ? "#EF4444" : "#8B5CF6",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-warning" />
                      <h4 className="font-medium text-white">{campaign.title}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        campaign.priority === "HIGH"
                          ? "bg-error/20 text-error-light"
                          : "bg-brand/20 text-brand-light"
                      }`}
                    >
                      {campaign.priority === "HIGH" ? "Prioritaire" : "Suggéré"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                  <div className="flex items-center gap-2 text-xs text-success-light">
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
      <div className="mt-4 pt-4 border-t border-border">
        <Link
          href="/causepilot"
          className="flex items-center justify-center gap-2 w-full py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Discuter avec CausePilot
        </Link>
      </div>
    </div>
  );
}
