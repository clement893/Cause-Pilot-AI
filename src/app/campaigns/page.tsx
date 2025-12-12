"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  Campaign,
  CampaignStatus,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from "@/types/campaign";

const STATUS_COLORS: Record<CampaignStatus, string> = {
  DRAFT: "bg-muted",
  SCHEDULED: "bg-info",
  ACTIVE: "bg-success",
  PAUSED: "bg-warning",
  COMPLETED: "bg-brand",
  CANCELLED: "bg-error",
  ARCHIVED: "bg-gray-400",
};

interface Stats {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalRaised: number;
    totalDonors: number;
    overallProgress: number;
  };
  activeCampaignsProgress: Array<{
    id: string;
    name: string;
    totalRaised: number;
    goalAmount: number | null;
    progress: number;
    daysRemaining: number | null;
  }>;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [campaignsRes, statsRes] = await Promise.all([
        fetch(`/api/campaigns${filter !== "all" ? `?status=${filter}` : ""}`),
        fetch("/api/campaigns/stats"),
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AppLayout
      title="Gestion des Campagnes"
      breadcrumbs={[
        { name: "Accueil", href: "/" },
        { name: "Campagnes", href: "/campaigns" },
      ]}
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total collecté</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.overview.totalRaised)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Campagnes actives</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.overview.activeCampaigns}
                </p>
              </div>
              <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-info-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total donateurs</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.overview.totalDonors}
                </p>
              </div>
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Progression globale</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.overview.overallProgress.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {["all", "ACTIVE", "DRAFT", "COMPLETED", "PAUSED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-accent text-white"
                  : "bg-surface-tertiary text-slate-300 hover:bg-surface-elevated"
              }`}
            >
              {status === "all" ? "Toutes" : CAMPAIGN_STATUS_LABELS[status as CampaignStatus]}
            </button>
          ))}
        </div>

        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-pink-600 text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle campagne
        </Link>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-surface-secondary/50 rounded-xl p-12 text-center border border-border">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Aucune campagne</h3>
          <p className="text-slate-400 mb-6">Créez votre première campagne de collecte</p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-pink-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const progress = campaign.goalAmount
              ? Math.min((campaign.totalRaised / campaign.goalAmount) * 100, 100)
              : 0;

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="bg-surface-secondary/50 rounded-xl border border-border overflow-hidden hover:border-accent/50 transition-colors group"
              >
                {/* Banner */}
                <div
                  className="h-32 relative"
                  style={{
                    background: campaign.bannerUrl
                      ? `url(${campaign.bannerUrl}) center/cover`
                      : `linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`,
                  }}
                >
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                        STATUS_COLORS[campaign.status]
                      }`}
                    >
                      {CAMPAIGN_STATUS_LABELS[campaign.status]}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white group-hover:text-accent transition-colors line-clamp-1">
                      {campaign.name}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-400 mb-4">
                    {CAMPAIGN_TYPE_LABELS[campaign.campaignType]}
                  </p>

                  {/* Progress */}
                  {campaign.goalAmount && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Progression</span>
                        <span className="text-white font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">
                          {formatCurrency(campaign.totalRaised)}
                        </span>
                        <span className="text-slate-500">
                          {formatCurrency(campaign.goalAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{campaign.donorCount} donateurs</span>
                    </div>
                    {campaign.endDate && (
                      <span className="text-slate-500">
                        Fin: {formatDate(campaign.endDate)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
