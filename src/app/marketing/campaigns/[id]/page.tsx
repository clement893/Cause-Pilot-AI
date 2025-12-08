"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
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
  const [activeTab, setActiveTab] = useState<"overview" | "recipients" | "analytics">("overview");

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

    try {
      const res = await fetch(`/api/marketing/campaigns/${resolvedParams.id}/send`, {
        method: "POST",
      });

      if (res.ok) {
        fetchCampaign();
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
    }
  };

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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/marketing/campaigns"
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(campaign.status)}`}>
                  {getStatusLabel(campaign.status)}
                </span>
              </div>
              {campaign.description && (
                <p className="text-gray-400 mt-1">{campaign.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {campaign.status === "DRAFT" && (
              <>
                <Link
                  href={`/marketing/campaigns/${campaign.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Link>
                <button
                  onClick={handleSend}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
              </>
            )}
            {campaign.status === "SCHEDULED" && (
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">
                <Pause className="w-4 h-4" />
                Annuler
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Destinataires</span>
            </div>
            <p className="text-2xl font-bold text-white">{campaign.totalRecipients}</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Send className="w-4 h-4" />
              <span className="text-xs">Envoyés</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{campaign.sentCount}</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Délivrés</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{campaign.deliveredCount}</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Taux ouverture</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{campaign.openRate.toFixed(1)}%</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MousePointer className="w-4 h-4" />
              <span className="text-xs">Taux clics</span>
            </div>
            <p className="text-2xl font-bold text-pink-400">{campaign.clickRate.toFixed(1)}%</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Rebonds</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{campaign.bounceCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="flex gap-4">
            {[
              { id: "overview", label: "Aperçu", icon: Mail },
              { id: "recipients", label: "Destinataires", icon: Users },
              { id: "analytics", label: "Analytiques", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
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
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Objet</h3>
                  <p className="text-white">{campaign.subject || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Prévisualisation</h3>
                  <p className="text-white">{campaign.preheader || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Expéditeur</h3>
                  <p className="text-white">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Répondre à</h3>
                  <p className="text-white">{campaign.replyTo || campaign.fromEmail}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Template</h3>
                  <p className="text-white">{campaign.template?.name || "Personnalisé"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Segments</h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.segments.length > 0 ? (
                      campaign.segments.map((segment) => (
                        <span key={segment} className="px-2 py-1 bg-slate-700 rounded text-sm text-white">
                          {segment}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">Tous les donateurs</span>
                    )}
                  </div>
                </div>
              </div>

              {campaign.scheduledAt && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Clock className="w-5 h-5" />
                    <span>
                      Planifié pour le {new Date(campaign.scheduledAt).toLocaleString("fr-CA")}
                    </span>
                  </div>
                </div>
              )}

              {campaign.sentAt && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      Envoyé le {new Date(campaign.sentAt).toLocaleString("fr-CA")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "recipients" && (
            <div>
              {recipients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-slate-700">
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Nom</th>
                        <th className="pb-3 font-medium">Statut</th>
                        <th className="pb-3 font-medium">Ouvertures</th>
                        <th className="pb-3 font-medium">Clics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {recipients.map((recipient) => (
                        <tr key={recipient.id} className="text-white">
                          <td className="py-3">{recipient.email}</td>
                          <td className="py-3">
                            {recipient.firstName || recipient.lastName
                              ? `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim()
                              : "-"}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {getRecipientStatusIcon(recipient.status)}
                              <span className="text-sm">{recipient.status}</span>
                            </div>
                          </td>
                          <td className="py-3">{recipient.openCount}</td>
                          <td className="py-3">{recipient.clickCount}</td>
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Funnel */}
                <div className="col-span-2 space-y-4">
                  <h3 className="font-semibold text-white">Entonnoir de conversion</h3>
                  {[
                    { label: "Envoyés", value: campaign.sentCount, color: "bg-blue-500" },
                    { label: "Délivrés", value: campaign.deliveredCount, color: "bg-green-500" },
                    { label: "Ouverts", value: campaign.openCount, color: "bg-purple-500" },
                    { label: "Cliqués", value: campaign.clickCount, color: "bg-pink-500" },
                  ].map((step, index) => (
                    <div key={step.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{step.label}</span>
                        <span className="text-white">{step.value}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${step.color} transition-all`}
                          style={{
                            width: `${campaign.sentCount > 0 ? (step.value / campaign.sentCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Problems */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Problèmes</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                      <span className="text-red-400">Rebonds</span>
                      <span className="text-white font-medium">{campaign.bounceCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                      <span className="text-orange-400">Désabonnements</span>
                      <span className="text-white font-medium">{campaign.unsubscribeCount}</span>
                    </div>
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
