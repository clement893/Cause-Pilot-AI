"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { sanitizeEmailHTML } from "@/lib/sanitize";
import {
  Mail,
  ArrowLeft,
  Send,
  Clock,
  Users,
  Eye,
  MousePointer,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaignType: string;
  status: string;
  subject: string | null;
  preheader: string | null;
  htmlContent: string | null;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  segments: string[];
  tags: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  isABTest: boolean;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  template: {
    id: string;
    name: string;
    category: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Recipient {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  openCount: number;
  clickCount: number;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "preview" | "recipients" | "analytics">("overview");

  useEffect(() => {
    fetchCampaign();
    fetchRecipients();
  }, [resolvedParams.id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await fetch(`/api/marketing/campaigns/${resolvedParams.id}/recipients`);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch (error) {
      console.error("Error fetching recipients:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) return;

    try {
      const res = await fetch(`/api/marketing/campaigns/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/marketing/campaigns");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const handleSend = async () => {
    if (!confirm("Êtes-vous sûr de vouloir envoyer cette campagne maintenant ?")) return;

    setSending(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${resolvedParams.id}/send`, {
        method: "POST",
      });

      if (res.ok) {
        fetchCampaign();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
    } finally {
      setSending(false);
    }
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
      SENDING: "En cours d'envoi",
      SENT: "Envoyé",
      PAUSED: "En pause",
      CANCELLED: "Annulé",
      FAILED: "Échoué",
    };
    return labels[status] || status;
  };

  const getRecipientStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "OPENED":
      case "CLICKED":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "BOUNCED":
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "PENDING":
      case "QUEUED":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getRecipientStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "En attente",
      QUEUED: "En file",
      SENT: "Envoyé",
      DELIVERED: "Délivré",
      OPENED: "Ouvert",
      CLICKED: "Cliqué",
      BOUNCED: "Rebond",
      FAILED: "Échoué",
      UNSUBSCRIBED: "Désabonné",
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ name: "Marketing", href: "/marketing" }, { name: "Campagnes", href: "/marketing/campaigns" }]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout breadcrumbs={[{ name: "Marketing", href: "/marketing" }, { name: "Campagnes", href: "/marketing/campaigns" }]}>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white">Campagne non trouvée</h2>
          <Link href="/marketing/campaigns" className="text-pink-400 hover:text-pink-300 mt-4 inline-block">
            Retour aux campagnes
          </Link>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Campagnes", href: "/marketing/campaigns" },
    { name: campaign.name, href: `/marketing/campaigns/${campaign.id}` },
  ];

  const isSent = campaign.status === "SENT" || campaign.status === "SENDING";
  const isDraft = campaign.status === "DRAFT";

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              href="/marketing/campaigns"
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(campaign.status)}`}>
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
              {campaign.subject && (
                <p className="text-gray-400 mt-1">Objet: {campaign.subject}</p>
              )}
              {campaign.description && (
                <p className="text-gray-500 text-sm mt-1">{campaign.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isDraft && (
              <>
                <Link
                  href={`/marketing/campaigns/new?edit=${campaign.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Continuer l&apos;édition
                </Link>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Envoyer maintenant
                </button>
              </>
            )}
            {campaign.status === "SCHEDULED" && (
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">
                <Pause className="w-4 h-4" />
                Annuler la planification
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards - Only show for sent campaigns */}
        {isSent && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs">Destinataires</span>
              </div>
              <p className="text-2xl font-bold text-white">{campaign.totalRecipients.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Send className="w-4 h-4" />
                <span className="text-xs">Envoyés</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{campaign.sentCount.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Délivrés</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{campaign.deliveredCount.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Taux ouverture</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{campaign.openRate?.toFixed(1) || 0}%</p>
              <p className="text-xs text-gray-500">{campaign.openCount} ouvertures</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-pink-400 mb-2">
                <MousePointer className="w-4 h-4" />
                <span className="text-xs">Taux clics</span>
              </div>
              <p className="text-2xl font-bold text-pink-400">{campaign.clickRate?.toFixed(1) || 0}%</p>
              <p className="text-xs text-gray-500">{campaign.clickCount} clics</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs">Rebonds</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{campaign.bounceCount}</p>
              <p className="text-xs text-gray-500">{campaign.bounceRate?.toFixed(1) || 0}%</p>
            </div>
          </div>
        )}

        {/* Draft info */}
        {isDraft && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">Campagne en brouillon</p>
                <p className="text-gray-400 text-sm">
                  Cette campagne n&apos;a pas encore été envoyée. Cliquez sur &quot;Continuer l&apos;édition&quot; pour la modifier ou &quot;Envoyer maintenant&quot; pour l&apos;envoyer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="flex gap-2 overflow-x-auto">
            {[
              { id: "overview", label: "Aperçu", icon: Mail },
              { id: "preview", label: "Prévisualisation", icon: Eye },
              ...(isSent ? [
                { id: "recipients", label: "Destinataires", icon: Users },
                { id: "analytics", label: "Résultats", icon: BarChart3 },
              ] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-pink-500 text-pink-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Objet de l&apos;email</h3>
                    <p className="text-white text-lg">{campaign.subject || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Texte de prévisualisation</h3>
                    <p className="text-white">{campaign.preheader || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Expéditeur</h3>
                    <p className="text-white">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Répondre à</h3>
                    <p className="text-white">{campaign.replyTo || campaign.fromEmail}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Type de campagne</h3>
                    <p className="text-white">
                      {campaign.campaignType === "ONE_TIME" ? "Ponctuel" :
                       campaign.campaignType === "RECURRING" ? "Récurrent" :
                       campaign.campaignType === "AUTOMATED" ? "Automatisé" : campaign.campaignType}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Template</h3>
                    <p className="text-white">{campaign.template?.name || "Personnalisé"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Segments ciblés</h3>
                    <div className="flex flex-wrap gap-2">
                      {campaign.segments && campaign.segments.length > 0 ? (
                        campaign.segments.map((segment) => (
                          <span key={segment} className="px-2 py-1 bg-slate-700 rounded text-sm text-white">
                            {segment}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Tous les donateurs éligibles</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Créé le</h3>
                    <p className="text-white">{formatDate(campaign.createdAt)}</p>
                  </div>
                </div>
              </div>

              {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Clock className="w-5 h-5" />
                    <span>Planifié pour le {formatDate(campaign.scheduledAt)}</span>
                  </div>
                </div>
              )}

              {campaign.sentAt && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Envoyé le {formatDate(campaign.sentAt)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Prévisualisation de l&apos;email</h3>
              </div>
              
              {campaign.htmlContent ? (
                <div className="bg-white rounded-lg overflow-hidden">
                  {/* Email Header Preview */}
                  <div className="bg-gray-100 p-4 border-b">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {campaign.fromName?.[0] || "C"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{campaign.fromName}</p>
                        <p className="text-sm text-gray-500">{campaign.fromEmail}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">{campaign.subject}</p>
                    {campaign.preheader && (
                      <p className="text-sm text-gray-500 truncate">{campaign.preheader}</p>
                    )}
                  </div>

                  {/* Email Body Preview */}
                  <div className="p-6">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeEmailHTML(campaign.htmlContent
                          .replace(/{{firstName}}/g, "Jean")
                          .replace(/{{lastName}}/g, "Dupont")
                          .replace(/{{email}}/g, "jean.dupont@exemple.com")
                          .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"))),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun contenu HTML disponible</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "recipients" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Liste des destinataires</h3>
                <span className="text-gray-400 text-sm">{recipients.length} destinataires</span>
              </div>
              
              {recipients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-slate-700">
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Nom</th>
                        <th className="pb-3 font-medium">Statut</th>
                        <th className="pb-3 font-medium text-center">Ouvertures</th>
                        <th className="pb-3 font-medium text-center">Clics</th>
                        <th className="pb-3 font-medium">Dernière activité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {recipients.map((recipient) => (
                        <tr key={recipient.id} className="text-white hover:bg-slate-700/50">
                          <td className="py-3">{recipient.email}</td>
                          <td className="py-3">
                            {recipient.firstName || recipient.lastName
                              ? `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim()
                              : "-"}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {getRecipientStatusIcon(recipient.status)}
                              <span className="text-sm">{getRecipientStatusLabel(recipient.status)}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className={recipient.openCount > 0 ? "text-purple-400" : "text-gray-500"}>
                              {recipient.openCount}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={recipient.clickCount > 0 ? "text-pink-400" : "text-gray-500"}>
                              {recipient.clickCount}
                            </span>
                          </td>
                          <td className="py-3 text-gray-400 text-sm">
                            {recipient.clickedAt ? formatDate(recipient.clickedAt) :
                             recipient.openedAt ? formatDate(recipient.openedAt) :
                             recipient.sentAt ? formatDate(recipient.sentAt) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun destinataire pour cette campagne</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-8">
              {/* Performance Summary */}
              <div>
                <h3 className="font-semibold text-white mb-4">Résumé des performances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Taux d&apos;ouverture</span>
                      <span className={`flex items-center gap-1 text-sm ${campaign.openRate > 20 ? "text-green-400" : "text-yellow-400"}`}>
                        {campaign.openRate > 20 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {campaign.openRate > 20 ? "Bon" : "À améliorer"}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-purple-400">{campaign.openRate?.toFixed(1) || 0}%</p>
                    <p className="text-sm text-gray-500 mt-1">Moyenne secteur: 20-25%</p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Taux de clics</span>
                      <span className={`flex items-center gap-1 text-sm ${campaign.clickRate > 3 ? "text-green-400" : "text-yellow-400"}`}>
                        {campaign.clickRate > 3 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {campaign.clickRate > 3 ? "Bon" : "À améliorer"}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-pink-400">{campaign.clickRate?.toFixed(1) || 0}%</p>
                    <p className="text-sm text-gray-500 mt-1">Moyenne secteur: 2-5%</p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Taux de rebond</span>
                      <span className={`flex items-center gap-1 text-sm ${campaign.bounceRate < 2 ? "text-green-400" : "text-red-400"}`}>
                        {campaign.bounceRate < 2 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {campaign.bounceRate < 2 ? "Bon" : "Élevé"}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-red-400">{campaign.bounceRate?.toFixed(1) || 0}%</p>
                    <p className="text-sm text-gray-500 mt-1">Objectif: &lt; 2%</p>
                  </div>
                </div>
              </div>

              {/* Funnel */}
              <div>
                <h3 className="font-semibold text-white mb-4">Entonnoir de conversion</h3>
                <div className="space-y-4">
                  {[
                    { label: "Envoyés", value: campaign.sentCount, total: campaign.sentCount, color: "bg-blue-500" },
                    { label: "Délivrés", value: campaign.deliveredCount, total: campaign.sentCount, color: "bg-green-500" },
                    { label: "Ouverts", value: campaign.openCount, total: campaign.sentCount, color: "bg-purple-500" },
                    { label: "Cliqués", value: campaign.clickCount, total: campaign.sentCount, color: "bg-pink-500" },
                  ].map((step) => (
                    <div key={step.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{step.label}</span>
                        <span className="text-white">
                          {step.value.toLocaleString()} 
                          <span className="text-gray-500 ml-2">
                            ({step.total > 0 ? ((step.value / step.total) * 100).toFixed(1) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${step.color} transition-all`}
                          style={{
                            width: `${step.total > 0 ? (step.value / step.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Problems */}
              <div>
                <h3 className="font-semibold text-white mb-4">Problèmes détectés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div>
                      <span className="text-red-400 font-medium">Rebonds</span>
                      <p className="text-gray-400 text-sm">Emails non délivrés</p>
                    </div>
                    <span className="text-2xl font-bold text-white">{campaign.bounceCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div>
                      <span className="text-orange-400 font-medium">Désabonnements</span>
                      <p className="text-gray-400 text-sm">Ont quitté la liste</p>
                    </div>
                    <span className="text-2xl font-bold text-white">{campaign.unsubscribeCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
