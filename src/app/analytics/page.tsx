"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

interface OverviewData {
  donors: {
    total: number;
    active: number;
    newThisMonth: number;
    totalDonations: number;
    averageDonation: number;
    averageLifetimeValue: number;
    highestDonation: number;
  };
  forms: {
    total: number;
    published: number;
    totalCollected: number;
    totalDonations: number;
    averageDonation: number;
  };
  submissions: {
    total: number;
    completed: number;
    pending: number;
    recurring: number;
    totalAmount: number;
    averageAmount: number;
    maxAmount: number;
    conversionRate: number;
  };
  segments: Array<{ name: string; count: number; totalDonations: number }>;
  donorTypes: Array<{ type: string; count: number; totalDonations: number }>;
}

interface TrendsData {
  period: string;
  donations: Array<{ period: string; amount: number; count: number; recurring: number; oneTime: number }>;
  donors: Array<{ period: string; count: number; individual: number; corporate: number }>;
  growth: { donations: number; donors: number };
  totals: { donations: number; donationCount: number; newDonors: number };
}

interface TopData {
  topDonors: Array<{
    id: number;
    name: string;
    email: string;
    totalDonations: number;
    donationCount: number;
    segment: string | null;
    city: string | null;
  }>;
  topForms: Array<{
    id: number;
    name: string;
    totalCollected: number;
    donationCount: number;
    progress: number | null;
  }>;
  recentLargeDonations: Array<{
    id: number;
    amount: number;
    donor: string;
    formName: string;
    date: string;
  }>;
  byCity: Array<{ city: string; count: number; totalDonations: number }>;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [topData, setTopData] = useState<TopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "week" | "day">("month");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendsRes, topRes] = await Promise.all([
        fetch("/api/analytics/overview"),
        fetch(`/api/analytics/trends?period=${period}&months=12`),
        fetch("/api/analytics/top?limit=5"),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.data);
      }
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.data);
      }
      if (topRes.ok) {
        const data = await topRes.json();
        setTopData(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("fr-CA").format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ name: "Analytics & Reporting" }]}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ name: "Analytics & Reporting" }]}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics & Reporting</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Vue d&apos;ensemble des performances de collecte
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "month" | "week" | "day")}
              className="px-4 py-2 bg-surface-secondary border border-border text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="day">Derniers 30 jours</option>
              <option value="week">Dernières 12 semaines</option>
              <option value="month">Derniers 12 mois</option>
            </select>
            <button className="px-4 py-2 bg-surface-secondary border border-border text-foreground rounded-lg hover:bg-surface-tertiary transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-100 mb-1">Total Collecté</p>
              <p className="text-3xl font-bold">{formatCurrency(overview?.donors.totalDonations || 0)}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {trends?.growth.donations !== undefined && (
            <div className="mt-3 flex items-center gap-1 text-sm">
              {trends.growth.donations >= 0 ? (
                <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={trends.growth.donations >= 0 ? "text-green-300" : "text-red-300"}>
                {Math.abs(trends.growth.donations)}%
              </span>
              <span className="text-pink-200">vs période précédente</span>
            </div>
          )}
        </div>

        <div className="bg-surface-primary rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Donateurs Actifs</p>
              <p className="text-3xl font-bold text-white">{formatNumber(overview?.donors.active || 0)}</p>
            </div>
            <div className="p-3 bg-info/20 rounded-lg">
              <svg className="w-6 h-6 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-tertiary">
            +{overview?.donors.newThisMonth || 0} ce mois
          </p>
        </div>

        <div className="bg-surface-primary rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Don Moyen</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(overview?.donors.averageDonation || 0)}</p>
            </div>
            <div className="p-3 bg-success/20 rounded-lg">
              <svg className="w-6 h-6 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-tertiary">
            Max: {formatCurrency(overview?.donors.highestDonation || 0)}
          </p>
        </div>

        <div className="bg-surface-primary rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taux de Conversion</p>
              <p className="text-3xl font-bold text-white">{overview?.submissions.conversionRate || 0}%</p>
            </div>
            <div className="p-3 bg-warning/20 rounded-lg">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-tertiary">
            {overview?.submissions.completed || 0} / {overview?.submissions.total || 0} complétés
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donations Trend Chart */}
        <div className="bg-surface-primary rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Évolution des Dons</h3>
          <div className="h-64 flex items-end gap-1">
            {trends?.donations.slice(-12).map((d, i) => {
              const maxAmount = Math.max(...(trends?.donations.map(t => t.amount) || [1]));
              const height = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-pink-600 to-purple-500 rounded-t transition-all hover:from-pink-500 hover:to-purple-400"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${d.period}: ${formatCurrency(d.amount)}`}
                  />
                  <span className="text-xs text-text-tertiary truncate w-full text-center">
                    {d.period.split("-")[1] || d.period}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donor Types Distribution */}
        <div className="bg-surface-primary rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Répartition par Type</h3>
          <div className="space-y-4">
            {overview?.donorTypes.map((type, i) => {
              const total = overview.donorTypes.reduce((sum, t) => sum + t.count, 0);
              const percentage = total > 0 ? (type.count / total) * 100 : 0;
              const colors = ["bg-accent", "bg-brand", "bg-info", "bg-success"];
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{type.type}</span>
                    <span className="text-muted-foreground">{type.count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-surface-tertiary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[i % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Donors */}
        <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-white">Top Donateurs</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {topData?.topDonors.map((donor, i) => (
              <div key={donor.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{donor.name}</p>
                    <p className="text-xs text-text-tertiary">{donor.city || "N/A"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(donor.totalDonations)}</p>
                  <p className="text-xs text-text-tertiary">{donor.donationCount} dons</p>
                </div>
              </div>
            ))}
            {(!topData?.topDonors || topData.topDonors.length === 0) && (
              <div className="px-6 py-8 text-center text-text-tertiary">
                Aucun donateur trouvé
              </div>
            )}
          </div>
        </div>

        {/* Recent Large Donations */}
        <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-white">Dons Récents Importants</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {topData?.recentLargeDonations.map((donation) => (
              <div key={donation.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-secondary/50">
                <div>
                  <p className="text-sm font-medium text-white">{donation.donor}</p>
                  <p className="text-xs text-text-tertiary">{donation.formName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">{formatCurrency(donation.amount)}</p>
                  <p className="text-xs text-text-tertiary">{formatDate(donation.date)}</p>
                </div>
              </div>
            ))}
            {(!topData?.recentLargeDonations || topData.recentLargeDonations.length === 0) && (
              <div className="px-6 py-8 text-center text-text-tertiary">
                Aucun don récent
              </div>
            )}
          </div>
        </div>

        {/* Top Forms */}
        <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-white">Formulaires Performants</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {topData?.topForms.map((form, i) => (
              <div key={form.id} className="px-6 py-4 hover:bg-surface-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{form.name}</p>
                  <p className="text-sm font-semibold text-white">{formatCurrency(form.totalCollected)}</p>
                </div>
                {form.progress !== null && (
                  <div className="w-full bg-surface-tertiary rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                      style={{ width: `${Math.min(form.progress, 100)}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-text-tertiary mt-1">{form.donationCount} dons</p>
              </div>
            ))}
            {(!topData?.topForms || topData.topForms.length === 0) && (
              <div className="px-6 py-8 text-center text-text-tertiary">
                Aucun formulaire trouvé
              </div>
            )}
          </div>
        </div>

        {/* Donors by City */}
        <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-white">Donateurs par Ville</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {topData?.byCity.slice(0, 5).map((city, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-surface-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{city.city}</p>
                    <p className="text-xs text-text-tertiary">{city.count} donateurs</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">{formatCurrency(city.totalDonations)}</p>
              </div>
            ))}
            {(!topData?.byCity || topData.byCity.length === 0) && (
              <div className="px-6 py-8 text-center text-text-tertiary">
                Aucune donnée de ville
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segments Distribution */}
      <div className="mt-6 bg-surface-primary rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Répartition par Segment</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {overview?.segments.map((segment, i) => {
            const colors = [
              "from-pink-500 to-rose-600",
              "from-purple-500 to-indigo-600",
              "from-blue-500 to-cyan-600",
              "from-green-500 to-emerald-600",
              "from-yellow-500 to-orange-600",
            ];
            return (
              <div 
                key={i} 
                className={`bg-gradient-to-br ${colors[i % colors.length]} rounded-xl p-4 text-white`}
              >
                <p className="text-sm font-medium opacity-90">{segment.name}</p>
                <p className="text-2xl font-bold mt-1">{segment.count}</p>
                <p className="text-xs opacity-75 mt-1">{formatCurrency(segment.totalDonations)}</p>
              </div>
            );
          })}
          {(!overview?.segments || overview.segments.length === 0) && (
            <div className="col-span-full text-center text-text-tertiary py-4">
              Aucun segment défini
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
