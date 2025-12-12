"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import CausePilotWidget from "@/components/CausePilotWidget";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  RefreshCw,
  Heart,
  UserPlus,
  Megaphone,
  Bot,
  PlusCircle,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Clock,
  Calendar,
  Zap,
  ChevronRight,
  X,
  LayoutGrid,
} from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  action: string;
  priority: "high" | "medium" | "low";
}

interface Suggestion {
  id: string;
  type: "action" | "opportunity" | "growth";
  title: string;
  message: string;
  action: string;
  impact: "high" | "medium" | "low";
}

interface DonorToReengage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalDonated: number;
  lastDonationDate: string;
  donationCount: number;
  segment: string;
}

interface DashboardData {
  kpis: {
    totalDonors: number;
    newDonorsThisMonth: number;
    donorGrowth: number;
    activeDonors: number;
    inactiveDonors: number;
    recurringDonors: number;
    totalDonations: number;
    totalDonationsCount: number;
    donationsThisMonth: number;
    donationsThisYear: number;
    donationGrowth: number;
    averageDonation: number;
    recurringDonations: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalForms: number;
    activeForms: number;
  };
  period: {
    today: { amount: number; count: number };
    week: { amount: number; count: number };
    month: { amount: number; count: number };
    year: { amount: number; count: number };
  };
  monthlyGoal: {
    target: number;
    current: number;
    progress: number;
    remaining: number;
  };
  charts: {
    monthlyDonations: Array<{ month: string; fullMonth: string; amount: number; count: number }>;
    donorSegments: Array<{ segment: string; count: number }>;
  };
  recent: {
    donations: Array<{
      id: string;
      amount: number;
      donorName: string;
      donorEmail?: string;
      date: string;
      isRecurring: boolean;
      isAnonymous: boolean;
    }>;
    donors: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      createdAt: string;
      totalDonated: number;
    }>;
    campaigns: Array<{
      id: string;
      name: string;
      goalAmount: number | null;
      totalRaised: number;
      donorCount: number;
      progress: number;
      endDate: string | null;
      daysRemaining: number | null;
      primaryColor: string;
    }>;
  };
  donorsToReengage: DonorToReengage[];
  topDonors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totalDonated: number;
    donationCount: number;
    lastDonationDate: string;
    segment: string;
  }>;
  alerts: Alert[];
  suggestions: Suggestion[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "year">("month");

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "success": return <CheckCircle className="w-5 h-5 text-success-light" />;
      case "error": return <AlertTriangle className="w-5 h-5 text-error-light" />;
      default: return <Info className="w-5 h-5 text-info-light" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case "warning": return "bg-warning/20/30 border-warning/50";
      case "success": return "bg-success/20/30 border-success/50";
      case "error": return "bg-error/20/30 border-error/50";
      default: return "bg-info/20/30 border-info/50";
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "action": return <Zap className="w-5 h-5 text-brand-light" />;
      case "opportunity": return <Lightbulb className="w-5 h-5 text-warning" />;
      default: return <TrendingUp className="w-5 h-5 text-success-light" />;
    }
  };

  // Calculer le max pour le graphique
  const maxDonation = data?.charts.monthlyDonations
    ? Math.max(...data.charts.monthlyDonations.map((d) => d.amount), 1)
    : 1;

  const activeAlerts = data?.alerts.filter(a => !dismissedAlerts.includes(a.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Vue d&apos;ensemble de votre activité philanthropique
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            {activeAlerts.length > 0 && (
              <div className="relative">
                <button className="p-2 bg-surface-secondary border border-border rounded-lg hover:bg-surface-tertiary transition-colors">
                  <Bell className="w-5 h-5 text-foreground" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full text-xs text-white flex items-center justify-center">
                    {activeAlerts.length}
                  </span>
                </button>
              </div>
            )}
            <Link
              href="/dashboard/customize"
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg hover:bg-primary/30 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Personnaliser
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-border text-foreground rounded-lg hover:bg-surface-tertiary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement du dashboard...</p>
            </div>
          </div>
        ) : data ? (
          <>
            {/* Alertes */}
            {activeAlerts.length > 0 && (
              <div className="mb-6 space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${getAlertBg(alert.type)}`}
                  >
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className="font-medium text-white">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={alert.action}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CausePilot Widget */}
            <div className="mb-8">
              <CausePilotWidget
                stats={{
                  totalDonors: data.kpis.totalDonors,
                  newDonorsThisMonth: data.kpis.newDonorsThisMonth,
                  donorGrowth: data.kpis.donorGrowth,
                  totalDonations: data.kpis.totalDonations,
                  donationsThisMonth: data.kpis.donationsThisMonth,
                  donationGrowth: data.kpis.donationGrowth,
                  activeCampaigns: data.kpis.activeCampaigns,
                  averageDonation: data.kpis.averageDonation,
                }}
              />
            </div>

            {/* Objectif mensuel */}
            {data.monthlyGoal.target > 0 && (
              <div className="mb-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Objectif mensuel</h2>
                    <p className="text-sm text-muted-foreground">Basé sur les campagnes actives</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{data.monthlyGoal.progress.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(data.monthlyGoal.current)} / {formatCurrency(data.monthlyGoal.target)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-surface-tertiary rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(data.monthlyGoal.progress, 100)}%` }}
                  />
                </div>
                {data.monthlyGoal.remaining > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Il reste {formatCurrency(data.monthlyGoal.remaining)} à collecter
                  </p>
                )}
              </div>
            )}

            {/* Sélecteur de période + KPIs */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {(["today", "week", "month", "year"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? "bg-brand text-white"
                        : "bg-surface-secondary text-muted-foreground hover:bg-surface-tertiary"
                    }`}
                  >
                    {period === "today" && "Aujourd'hui"}
                    {period === "week" && "Cette semaine"}
                    {period === "month" && "Ce mois"}
                    {period === "year" && "Cette année"}
                  </button>
                ))}
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Dons période */}
                <div className="bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-success-light/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-success" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {data.period[selectedPeriod].count} dons
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {formatCurrency(data.period[selectedPeriod].amount)}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedPeriod === "today" && "Collecté aujourd'hui"}
                    {selectedPeriod === "week" && "Collecté cette semaine"}
                    {selectedPeriod === "month" && "Collecté ce mois"}
                    {selectedPeriod === "year" && "Collecté cette année"}
                  </p>
                </div>

                {/* Total Donateurs */}
                <div className="bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-brand-light/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-brand" />
                    </div>
                    <span
                      className={`flex items-center gap-1 text-sm font-medium ${
                        data.kpis.donorGrowth >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {data.kpis.donorGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(data.kpis.donorGrowth)}%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {data.kpis.totalDonors.toLocaleString()}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">Donateurs totaux</p>
                  <p className="text-brand text-xs mt-2">
                    +{data.kpis.newDonorsThisMonth} ce mois
                  </p>
                </div>

                {/* Campagnes actives */}
                <div className="bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-info-light/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-info" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {data.kpis.activeCampaigns}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">Campagnes actives</p>
                  <p className="text-info text-xs mt-2">
                    {data.kpis.totalCampaigns} au total
                  </p>
                </div>

                {/* Don moyen */}
                <div className="bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-pink-600" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white">
                    {formatCurrency(data.kpis.averageDonation)}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">Don moyen</p>
                  <p className="text-pink-600 text-xs mt-2">
                    {data.kpis.recurringDonors} donateurs récurrents
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Graphique des dons */}
              <div className="lg:col-span-2 bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    Évolution des dons
                  </h2>
                  <Link
                    href="/analytics"
                    className="text-brand hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir plus <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="h-64">
                  <div className="flex items-end justify-between h-full gap-2">
                    {data.charts.monthlyDonations.map((month, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-700 hover:to-purple-500 cursor-pointer group relative"
                          style={{
                            height: `${Math.max((month.amount / maxDonation) * 100, 5)}%`,
                          }}
                        >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {formatCurrency(month.amount)}
                            <br />
                            {month.count} dons
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground mt-2 truncate w-full text-center">
                          {month.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions CausePilot */}
              <div className="bg-gradient-to-br from-slate-900 to-purple-900/30 rounded-xl shadow-sm border border-purple-700/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    Suggestions CausePilot
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.suggestions.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href={suggestion.action}
                      className="block p-3 bg-surface-secondary/50 hover:bg-surface-secondary rounded-lg transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.message}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-white transition-colors" />
                      </div>
                    </Link>
                  ))}
                  {data.suggestions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Aucune suggestion pour le moment
                    </p>
                  )}
                  <Link
                    href="/copilot"
                    className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-colors text-white font-medium"
                  >
                    <Bot className="w-4 h-4" />
                    Demander à CausePilot
                  </Link>
                </div>
              </div>
            </div>

            {/* Donateurs à relancer */}
            {data.donorsToReengage.length > 0 && (
              <div className="mt-8 bg-warning/20/20 rounded-xl border border-warning/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Donateurs à relancer
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {data.donorsToReengage.length} donateur(s) inactif(s) depuis 6+ mois
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/donors?status=inactive"
                    className="text-warning hover:text-amber-300 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {data.donorsToReengage.slice(0, 5).map((donor) => (
                    <Link
                      key={donor.id}
                      href={`/donors/${donor.id}`}
                      className="p-4 bg-surface-secondary/50 hover:bg-surface-secondary rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                          <span className="text-warning font-medium text-sm">
                            {donor.firstName?.[0]}{donor.lastName?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {donor.firstName} {donor.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{donor.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-warning font-medium">
                          {formatCurrency(donor.totalDonated)}
                        </span>
                        <span className="text-text-tertiary text-xs">
                          {formatDateShort(donor.lastDonationDate)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Dons récents */}
              <div className="bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Dons récents
                  </h2>
                  <Link
                    href="/donors"
                    className="text-brand hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {data.recent.donations.slice(0, 5).map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-success-light/20 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {donation.isAnonymous ? "Donateur anonyme" : donation.donorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(donation.date)}
                            {donation.isRecurring && (
                              <span className="ml-2 px-1.5 py-0.5 bg-brand-light/20 text-purple-700 rounded text-xs">
                                Récurrent
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-success">
                        +{formatCurrency(donation.amount)}
                      </span>
                    </div>
                  ))}
                  {data.recent.donations.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun don récent
                    </p>
                  )}
                </div>
              </div>

              {/* Campagnes en cours */}
              <div className="bg-surface-primary rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Campagnes en cours
                  </h2>
                  <Link
                    href="/campaigns"
                    className="text-brand hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {data.recent.campaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="block p-4 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{campaign.name}</h3>
                        <div className="flex items-center gap-2">
                          {campaign.daysRemaining !== null && campaign.daysRemaining <= 7 && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-warning text-xs rounded-full">
                              {campaign.daysRemaining}j restants
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {campaign.donorCount} donateurs
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-tertiary rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {formatCurrency(campaign.totalRaised)} collectés
                        </span>
                        {campaign.goalAmount && (
                          <span className="text-muted-foreground">
                            Objectif: {formatCurrency(campaign.goalAmount)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                  {data.recent.campaigns.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Aucune campagne active</p>
                      <Link
                        href="/campaigns/new"
                        className="text-brand hover:text-purple-700 text-sm font-medium mt-2 inline-block"
                      >
                        Créer une campagne
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="mt-8 bg-surface-primary rounded-xl shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Actions rapides
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/donors/new"
                  className="flex items-center gap-3 p-4 bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-brand rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Nouveau donateur</p>
                    <p className="text-xs text-muted-foreground">Ajouter un contact</p>
                  </div>
                </Link>
                <Link
                  href="/forms/new"
                  className="flex items-center gap-3 p-4 bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Formulaire de don</p>
                    <p className="text-xs text-muted-foreground">Créer un formulaire</p>
                  </div>
                </Link>
                <Link
                  href="/campaigns/new"
                  className="flex items-center gap-3 p-4 bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Nouvelle campagne</p>
                    <p className="text-xs text-muted-foreground">Lancer une collecte</p>
                  </div>
                </Link>
                <Link
                  href="/copilot"
                  className="flex items-center gap-3 p-4 bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">CausePilot IA</p>
                    <p className="text-xs text-muted-foreground">Poser une question</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Top donateurs */}
            <div className="mt-8 bg-surface-primary rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Top donateurs
                </h2>
                <Link
                  href="/donors?sort=totalDonated"
                  className="text-brand hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                >
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {data.topDonors.map((donor, index) => (
                  <Link
                    key={donor.id}
                    href={`/donors/${donor.id}`}
                    className="p-4 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-center relative"
                  >
                    {index < 3 && (
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? "bg-amber-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        "bg-amber-700 text-white"
                      }`}>
                        {index + 1}
                      </div>
                    )}
                    <div className="w-12 h-12 bg-brand-light/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-brand font-semibold">
                        {donor.firstName?.[0]}
                        {donor.lastName?.[0]}
                      </span>
                    </div>
                    <p className="font-medium text-white truncate">
                      {donor.firstName} {donor.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{donor.email}</p>
                    <p className="text-sm text-success font-medium mt-1">
                      {formatCurrency(donor.totalDonated)}
                    </p>
                    <p className="text-xs text-text-tertiary">{donor.donationCount} dons</p>
                  </Link>
                ))}
                {data.topDonors.length === 0 && (
                  <div className="col-span-5 text-center py-8">
                    <Users className="w-12 h-12 text-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Aucun donateur</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Erreur lors du chargement des données</p>
            <button
              onClick={handleRefresh}
              className="mt-4 text-brand hover:text-purple-700 font-medium"
            >
              Réessayer
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
