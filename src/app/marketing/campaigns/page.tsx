"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Mail,
  Plus,
  Search,
  Clock,
  Users,
  Eye,
  MousePointer,
  Send,
  Edit,
  Trash2,
  Play,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
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
  completedAt: string | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
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
  createdAt: string;
  updatedAt: string;
}

type TabType = "all" | "draft" | "sent" | "scheduled";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/marketing/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/marketing/campaigns/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCampaigns(campaigns.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;
    
    if (!confirm(`Envoyer la campagne "${campaign.name}" maintenant ?`)) return;
    
    try {
      const res = await fetch(`/api/marketing/campaigns/${id}/send`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
    }
  };

  // Filter campaigns based on tab and search
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    switch (activeTab) {
      case "draft":
        return matchesSearch && campaign.status === "DRAFT";
      case "sent":
        return matchesSearch && (campaign.status === "SENT" || campaign.status === "SENDING");
      case "scheduled":
        return matchesSearch && campaign.status === "SCHEDULED";
      default:
        return matchesSearch;
    }
  });

  // Count campaigns by status
  const counts = {
    all: campaigns.length,
    draft: campaigns.filter((c) => c.status === "DRAFT").length,
    sent: campaigns.filter((c) => c.status === "SENT" || c.status === "SENDING").length,
    scheduled: campaigns.filter((c) => c.status === "SCHEDULED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DRAFT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "SENDING":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "PAUSED":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "FAILED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="w-4 h-4" />;
      case "SENDING":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "SCHEDULED":
        return <Clock className="w-4 h-4" />;
      case "DRAFT":
        return <FileText className="w-4 h-4" />;
      case "FAILED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Campagnes", href: "/marketing/campaigns" },
  ];

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Toutes", icon: <Mail className="w-4 h-4" /> },
    { key: "draft", label: "Brouillons", icon: <FileText className="w-4 h-4" /> },
    { key: "sent", label: "Envoyées", icon: <CheckCircle className="w-4 h-4" /> },
    { key: "scheduled", label: "Planifiées", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Campagnes Email</h1>
            <p className="text-gray-400 mt-1">
              Gérez vos campagnes email marketing
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

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{counts.all}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Brouillons</span>
            </div>
            <p className="text-2xl font-bold text-white">{counts.draft}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-green-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Envoyées</span>
            </div>
            <p className="text-2xl font-bold text-white">{counts.sent}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Planifiées</span>
            </div>
            <p className="text-2xl font-bold text-white">{counts.scheduled}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                  : "text-gray-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? "bg-pink-500/30" : "bg-slate-700"
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une campagne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => router.push(`/marketing/campaigns/${campaign.id}`)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left side - Campaign info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        campaign.status === "DRAFT" ? "bg-yellow-500/20" :
                        campaign.status === "SENT" ? "bg-green-500/20" :
                        campaign.status === "SENDING" ? "bg-purple-500/20" :
                        "bg-blue-500/20"
                      }`}>
                        {getStatusIcon(campaign.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-white hover:text-pink-400 transition-colors">
                            {campaign.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(campaign.status)}`}>
                            {getStatusLabel(campaign.status)}
                          </span>
                        </div>
                        
                        {campaign.subject && (
                          <p className="text-gray-400 text-sm mt-1">
                            <span className="text-gray-500">Objet:</span> {campaign.subject}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {campaign.createdAt && (
                            <span>Créé le {formatDate(campaign.createdAt)}</span>
                          )}
                          {campaign.sentAt && (
                            <span className="text-green-400">
                              Envoyé le {formatDate(campaign.sentAt)}
                            </span>
                          )}
                          {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
                            <span className="text-blue-400">
                              Planifié pour le {formatDate(campaign.scheduledAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Stats and Actions */}
                  <div className="flex items-center gap-6">
                    {/* Stats for sent campaigns */}
                    {(campaign.status === "SENT" || campaign.status === "SENDING") && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{campaign.sentCount || campaign.totalRecipients}</span>
                          </div>
                          <span className="text-xs text-gray-500">Envoyés</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-blue-400">
                            <Eye className="w-4 h-4" />
                            <span>{campaign.openRate?.toFixed(1) || 0}%</span>
                          </div>
                          <span className="text-xs text-gray-500">Ouvertures</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-purple-400">
                            <MousePointer className="w-4 h-4" />
                            <span>{campaign.clickRate?.toFixed(1) || 0}%</span>
                          </div>
                          <span className="text-xs text-gray-500">Clics</span>
                        </div>
                      </div>
                    )}

                    {/* Recipients count for drafts */}
                    {campaign.status === "DRAFT" && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{campaign._count?.recipients || campaign.totalRecipients || 0} destinataires</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Draft actions */}
                      {campaign.status === "DRAFT" && (
                        <>
                          <Link
                            href={`/marketing/campaigns/new?edit=${campaign.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit className="w-4 h-4" />
                            Continuer
                          </Link>
                          <button
                            onClick={(e) => handleSend(campaign.id, e)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                          >
                            <Play className="w-4 h-4" />
                            Envoyer
                          </button>
                        </>
                      )}

                      {/* Sent actions */}
                      {(campaign.status === "SENT" || campaign.status === "SENDING") && (
                        <Link
                          href={`/marketing/campaigns/${campaign.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BarChart3 className="w-4 h-4" />
                          Résultats
                        </Link>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(campaign.id, e)}
                        disabled={deletingId === campaign.id}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        {deletingId === campaign.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
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
              {activeTab === "draft" ? "Aucun brouillon" :
               activeTab === "sent" ? "Aucune campagne envoyée" :
               activeTab === "scheduled" ? "Aucune campagne planifiée" :
               "Aucune campagne trouvée"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? "Aucune campagne ne correspond à votre recherche"
                : activeTab === "draft"
                ? "Créez une nouvelle campagne pour commencer"
                : activeTab === "sent"
                ? "Envoyez votre première campagne"
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
