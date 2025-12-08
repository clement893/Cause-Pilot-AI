"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  Mail,
  Plus,
  Search,
  Filter,
  Clock,
  Users,
  Eye,
  MousePointer,
  MoreVertical,
  Send,
  Pause,
  Trash2,
  Edit,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaignType: string;
  status: string;
  subject: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
  template: {
    id: string;
    name: string;
    category: string;
  } | null;
  _count: {
    recipients: number;
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, typeFilter]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);

      const res = await fetch(`/api/marketing/campaigns?${params}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "SENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "PAUSED":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      SCHEDULED: "Planifié",
      SENDING: "En cours",
      SENT: "Envoyé",
      PAUSED: "En pause",
      CANCELLED: "Annulé",
      FAILED: "Échoué",
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ONE_TIME: "Ponctuel",
      RECURRING: "Récurrent",
      AUTOMATED: "Automatisé",
      TRANSACTIONAL: "Transactionnel",
    };
    return labels[type] || type;
  };

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Campagnes", href: "/marketing/campaigns" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Campagnes Email</h1>
            <p className="text-gray-400 mt-1">
              Créez et gérez vos campagnes email marketing
            </p>
          </div>
          <Link
            href="/marketing/campaigns/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="SCHEDULED">Planifié</option>
              <option value="SENDING">En cours</option>
              <option value="SENT">Envoyé</option>
              <option value="PAUSED">En pause</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">Tous les types</option>
              <option value="ONE_TIME">Ponctuel</option>
              <option value="RECURRING">Récurrent</option>
              <option value="AUTOMATED">Automatisé</option>
            </select>
          </div>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Mail className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <Link
                          href={`/marketing/campaigns/${campaign.id}`}
                          className="text-lg font-semibold text-white hover:text-pink-400 transition-colors"
                        >
                          {campaign.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {getTypeLabel(campaign.campaignType)}
                          </span>
                          {campaign.template && (
                            <span className="text-sm text-gray-500">
                              Template: {campaign.template.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {campaign.subject && (
                      <p className="text-gray-400 text-sm mt-2 ml-12">
                        Objet: {campaign.subject}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{campaign._count.recipients || campaign.totalRecipients}</span>
                      </div>
                      {campaign.status === "SENT" && (
                        <>
                          <div className="flex items-center gap-1 text-blue-400">
                            <Eye className="w-4 h-4" />
                            <span>{campaign.openRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-1 text-purple-400">
                            <MousePointer className="w-4 h-4" />
                            <span>{campaign.clickRate.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                      {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(campaign.scheduledAt).toLocaleDateString("fr-CA")}</span>
                        </div>
                      )}
                      {campaign.sentAt && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Send className="w-4 h-4" />
                          <span>{new Date(campaign.sentAt).toLocaleDateString("fr-CA")}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/marketing/campaigns/${campaign.id}`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {campaign.status === "DRAFT" && (
                        <Link
                          href={`/marketing/campaigns/${campaign.id}/edit`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
            <Mail className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucune campagne trouvée
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter || typeFilter
                ? "Aucune campagne ne correspond à vos critères"
                : "Commencez par créer votre première campagne email"}
            </p>
            <Link
              href="/marketing/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Créer une campagne
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
