"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  Mail,
  FileText,
  Zap,
  Send,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  MousePointer,
  AlertCircle,
} from "lucide-react";

interface Stats {
  totalCampaigns: number;
  sentCampaigns: number;
  totalRecipients: number;
  avgOpenRate: number;
  avgClickRate: number;
  activeAutomations: number;
}

interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  sentAt: string | null;
  openRate: number;
  clickRate: number;
  totalRecipients: number;
}

export default function MarketingPage() {
  const [stats, setStats] = useState<Stats>({
    totalCampaigns: 0,
    sentCampaigns: 0,
    totalRecipients: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    activeAutomations: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch campaigns
      const campaignsRes = await fetch("/api/marketing/campaigns?limit=5");
      const campaignsData = await campaignsRes.json();

      // Fetch automations
      const automationsRes = await fetch("/api/marketing/automations");
      const automationsData = await automationsRes.json();

      // Calculate stats
      const campaigns = campaignsData.campaigns || [];
      const sentCampaigns = campaigns.filter((c: RecentCampaign) => c.status === "SENT");
      const totalRecipients = campaigns.reduce((sum: number, c: RecentCampaign) => sum + (c.totalRecipients || 0), 0);
      const avgOpenRate = sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum: number, c: RecentCampaign) => sum + c.openRate, 0) / sentCampaigns.length
        : 0;
      const avgClickRate = sentCampaigns.length > 0
        ? sentCampaigns.reduce((sum: number, c: RecentCampaign) => sum + c.clickRate, 0) / sentCampaigns.length
        : 0;
      const activeAutomations = (automationsData || []).filter((a: { isActive: boolean }) => a.isActive).length;

      setStats({
        totalCampaigns: campaignsData.pagination?.total || 0,
        sentCampaigns: sentCampaigns.length,
        totalRecipients,
        avgOpenRate,
        avgClickRate,
        activeAutomations,
      });

      setRecentCampaigns(campaigns.slice(0, 5));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-500/20 text-green-400";
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-400";
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400";
      case "SENDING":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SENT":
        return "Envoyé";
      case "SCHEDULED":
        return "Planifié";
      case "DRAFT":
        return "Brouillon";
      case "SENDING":
        return "En cours";
      case "PAUSED":
        return "En pause";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  const breadcrumbs = [{ name: "Marketing", href: "/marketing" }];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Marketing Automation</h1>
            <p className="text-gray-400 mt-1">
              Gérez vos campagnes email et automatisations
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/marketing/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nouvelle campagne
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/marketing/campaigns"
            className="group p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-pink-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                <Mail className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Campagnes Email</h3>
                <p className="text-sm text-gray-400">Créer et gérer vos envois</p>
              </div>
            </div>
          </Link>

          <Link
            href="/marketing/templates"
            className="group p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Templates</h3>
                <p className="text-sm text-gray-400">Modèles email réutilisables</p>
              </div>
            </div>
          </Link>

          <Link
            href="/marketing/automations"
            className="group p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Automatisations</h3>
                <p className="text-sm text-gray-400">Workflows automatiques</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Send className="w-4 h-4" />
              <span className="text-xs">Campagnes</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? "..." : stats.totalCampaigns}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Envoyées</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {loading ? "..." : stats.sentCampaigns}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Destinataires</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? "..." : stats.totalRecipients.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Taux ouverture</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {loading ? "..." : `${stats.avgOpenRate.toFixed(1)}%`}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MousePointer className="w-4 h-4" />
              <span className="text-xs">Taux clics</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {loading ? "..." : `${stats.avgClickRate.toFixed(1)}%`}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Automations</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {loading ? "..." : stats.activeAutomations}
            </p>
          </div>
        </div>

        {/* Recent Campaigns & Automations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Campagnes récentes</h2>
              <Link
                href="/marketing/campaigns"
                className="text-sm text-pink-400 hover:text-pink-300"
              >
                Voir tout →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/marketing/campaigns/${campaign.id}`}
                    className="block p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{campaign.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                          </span>
                          {campaign.sentAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(campaign.sentAt).toLocaleDateString("fr-CA")}
                            </span>
                          )}
                        </div>
                      </div>
                      {campaign.status === "SENT" && (
                        <div className="text-right text-sm">
                          <div className="text-blue-400">{campaign.openRate.toFixed(1)}% ouv.</div>
                          <div className="text-purple-400">{campaign.clickRate.toFixed(1)}% clics</div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune campagne créée</p>
                <Link
                  href="/marketing/campaigns/new"
                  className="text-pink-400 hover:text-pink-300 text-sm mt-2 inline-block"
                >
                  Créer votre première campagne
                </Link>
              </div>
            )}
          </div>

          {/* Automation Tips */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Automatisations suggérées</h2>
              <Link
                href="/marketing/automations"
                className="text-sm text-pink-400 hover:text-pink-300"
              >
                Configurer →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Email de bienvenue</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Envoyez automatiquement un email aux nouveaux donateurs
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Remerciement post-don</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Remerciez chaque donateur après leur contribution
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Réactivation</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Contactez les donateurs inactifs depuis 90 jours
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Anniversaire de don</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Célébrez la date anniversaire du premier don
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
