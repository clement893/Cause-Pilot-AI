"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Campaign,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_PRIORITY_LABELS,
} from "@/types/campaign";
import { FileText, Mail, Users, ExternalLink, TrendingUp, Eye, MousePointer } from "lucide-react";

interface LinkedForm {
  id: string;
  name: string;
  slug: string;
  formType: string;
  status: string;
  totalCollected: number;
  donationCount: number;
}

interface LinkedEmailCampaign {
  id: string;
  name: string;
  subject: string | null;
  status: string;
  sentAt: string | null;
  totalRecipients: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
}

interface DonorWithDetails {
  id: string;
  totalDonated: number;
  donationCount: number;
  firstDonationDate: string | null;
  lastDonationDate: string | null;
  donorLevel: string;
  isRecurring: boolean;
  isMajorDonor: boolean;
  donor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    totalDonated: number;
    donationCount: number;
    status: string;
    segment: string;
  } | null;
}

interface ExtendedCampaign extends Campaign {
  linkedForms?: LinkedForm[];
  linkedEmailCampaigns?: LinkedEmailCampaign[];
  donorsWithDetails?: DonorWithDetails[];
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<ExtendedCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "forms" | "emails" | "donors">("overview");

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data);
      } else {
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchCampaign();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette campagne ?")) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error:", error);
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
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "ACTIVE":
      case "SENT":
        return "bg-success/20/50 text-success-light";
      case "DRAFT":
        return "bg-surface-tertiary text-slate-300";
      case "SCHEDULED":
        return "bg-info/20/50 text-info-light";
      case "PAUSED":
        return "bg-yellow-900/50 text-yellow-400";
      default:
        return "bg-surface-tertiary text-slate-300";
    }
  };

  if (loading) {
    return (
      <AppLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout title="Campagne non trouvée">
        <div className="text-center py-12">
          <p className="text-slate-400">Cette campagne n&apos;existe pas.</p>
          <Link href="/campaigns" className="text-accent hover:underline mt-4 inline-block">
            Retour aux campagnes
          </Link>
        </div>
      </AppLayout>
    );
  }

  const progress = campaign.goalAmount
    ? Math.min((campaign.totalRaised / campaign.goalAmount) * 100, 100)
    : 0;

  return (
    <AppLayout
      title={campaign.name}
      breadcrumbs={[
        { name: "Accueil", href: "/" },
        { name: "Campagnes", href: "/campaigns" },
        { name: campaign.name, href: `/campaigns/${id}` },
      ]}
    >
      {/* Header avec bannière */}
      <div
        className="h-48 rounded-xl mb-6 relative overflow-hidden"
        style={{
          background: campaign.bannerUrl
            ? `url(${campaign.bannerUrl}) center/cover`
            : `linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`,
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm">
              {CAMPAIGN_TYPE_LABELS[campaign.campaignType]}
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/campaigns/${id}/edit`}
              className="px-4 py-2 bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Modifier
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-error/80 hover:bg-error text-white rounded-lg transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Aperçu
          </button>
          <button
            onClick={() => setActiveTab("forms")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "forms"
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Formulaires ({campaign.linkedForms?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("emails")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "emails"
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-foreground"
            }`}
          >
            <Mail className="w-4 h-4" />
            Campagnes Courriel ({campaign.linkedEmailCampaigns?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("donors")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "donors"
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Donateurs ({campaign.donorsWithDetails?.length || 0})
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progression */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Progression de la collecte</h2>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Collecté</span>
                  <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.totalRaised)}</p>
                  <p className="text-sm text-slate-400">Collecté</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {campaign.goalAmount ? formatCurrency(campaign.goalAmount) : "—"}
                  </p>
                  <p className="text-sm text-slate-400">Objectif</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {campaign.daysRemaining !== null ? campaign.daysRemaining : "—"}
                  </p>
                  <p className="text-sm text-slate-400">Jours restants</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
              {campaign.shortDescription && (
                <p className="text-slate-300 font-medium mb-4">{campaign.shortDescription}</p>
              )}
              <p className="text-slate-400 whitespace-pre-wrap">
                {campaign.description || "Aucune description"}
              </p>
            </div>

            {/* Statistiques */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Statistiques</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-tertiary/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{campaign.donorCount}</p>
                  <p className="text-sm text-slate-400">Donateurs</p>
                </div>
                <div className="bg-surface-tertiary/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{campaign.donationCount}</p>
                  <p className="text-sm text-slate-400">Dons</p>
                </div>
                <div className="bg-surface-tertiary/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.averageDonation)}</p>
                  <p className="text-sm text-slate-400">Don moyen</p>
                </div>
                <div className="bg-surface-tertiary/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{formatCurrency(campaign.largestDonation)}</p>
                  <p className="text-sm text-slate-400">Plus grand don</p>
                </div>
              </div>
            </div>

            {/* Jalons */}
            {campaign.milestones && campaign.milestones.length > 0 && (
              <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold text-white mb-4">Jalons</h2>
                
                <div className="space-y-4">
                  {campaign.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        milestone.isCompleted ? "bg-success/10" : "bg-surface-tertiary/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          milestone.isCompleted ? "bg-success" : "bg-surface-elevated"
                        }`}
                      >
                        {milestone.isCompleted ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-white font-medium">{milestone.sortOrder}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-sm text-slate-400">{milestone.description}</p>
                        )}
                      </div>
                      {milestone.targetAmount && (
                        <span className="text-slate-300 font-medium">
                          {formatCurrency(milestone.targetAmount)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Statut et actions */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Statut</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Statut actuel</p>
                  <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
                    {CAMPAIGN_STATUS_LABELS[campaign.status]}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Changer le statut</p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.status === "DRAFT" && (
                      <button
                        onClick={() => handleStatusChange("ACTIVE")}
                        className="px-3 py-1 bg-success hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Lancer
                      </button>
                    )}
                    {campaign.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleStatusChange("PAUSED")}
                          className="px-3 py-1 bg-warning hover:bg-yellow-600 text-white rounded-lg text-sm transition-colors"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => handleStatusChange("COMPLETED")}
                          className="px-3 py-1 bg-brand hover:bg-brand text-white rounded-lg text-sm transition-colors"
                        >
                          Terminer
                        </button>
                      </>
                    )}
                    {campaign.status === "PAUSED" && (
                      <button
                        onClick={() => handleStatusChange("ACTIVE")}
                        className="px-3 py-1 bg-success hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Reprendre
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Informations</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Priorité</p>
                  <p className="text-white">{CAMPAIGN_PRIORITY_LABELS[campaign.priority]}</p>
                </div>
                
                {campaign.startDate && (
                  <div>
                    <p className="text-sm text-slate-400">Date de début</p>
                    <p className="text-white">{formatDate(campaign.startDate)}</p>
                  </div>
                )}
                
                {campaign.endDate && (
                  <div>
                    <p className="text-sm text-slate-400">Date de fin</p>
                    <p className="text-white">{formatDate(campaign.endDate)}</p>
                  </div>
                )}

                {campaign.category && (
                  <div>
                    <p className="text-sm text-slate-400">Catégorie</p>
                    <p className="text-white">{campaign.category}</p>
                  </div>
                )}

                {campaign.tags && campaign.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {campaign.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-surface-tertiary text-slate-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Options</h2>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Publique</span>
                  <span className={campaign.isPublic ? "text-success-light" : "text-slate-500"}>
                    {campaign.isPublic ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">P2P autorisé</span>
                  <span className={campaign.allowP2P ? "text-success-light" : "text-slate-500"}>
                    {campaign.allowP2P ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Matching actif</span>
                  <span className={campaign.enableMatching ? "text-success-light" : "text-slate-500"}>
                    {campaign.enableMatching ? "Oui" : "Non"}
                  </span>
                </div>
                {campaign.enableMatching && campaign.matchingRatio && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ratio matching</span>
                    <span className="text-white">{campaign.matchingRatio}:1</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold text-white mb-4">Historique</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Créée le</span>
                  <span className="text-white">{formatDate(campaign.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Modifiée le</span>
                  <span className="text-white">{formatDate(campaign.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Formulaires */}
      {activeTab === "forms" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Formulaires liés à cette campagne</h2>
            <Link
              href="/forms/new"
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
            >
              + Nouveau formulaire
            </Link>
          </div>

          {campaign.linkedForms && campaign.linkedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.linkedForms.map((form) => (
                <Link
                  key={form.id}
                  href={`/forms/${form.id}`}
                  className="bg-surface-secondary/50 rounded-xl p-6 border border-border hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.status)}`}>
                      {form.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{form.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{form.formType}</p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{formatCurrency(form.totalCollected)}</p>
                      <p className="text-xs text-slate-400">Collecté</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{form.donationCount}</p>
                      <p className="text-xs text-slate-400">Dons</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-surface-secondary/50 rounded-xl p-12 border border-border text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucun formulaire lié</h3>
              <p className="text-slate-400 mb-4">Créez un formulaire et associez-le à cette campagne</p>
              <Link
                href="/forms/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
              >
                + Créer un formulaire
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Onglet Campagnes Courriel */}
      {activeTab === "emails" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Campagnes courriel liées</h2>
            <Link
              href="/marketing/email/new"
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
            >
              + Nouvelle campagne
            </Link>
          </div>

          {campaign.linkedEmailCampaigns && campaign.linkedEmailCampaigns.length > 0 ? (
            <div className="bg-surface-secondary/50 rounded-xl border border-border overflow-hidden">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-surface-primary/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Campagne
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Envoyés
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Ouvertures
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <MousePointer className="w-4 h-4" />
                        Clics
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {campaign.linkedEmailCampaigns.map((email) => (
                    <tr key={email.id} className="hover:bg-surface-tertiary/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{email.name}</p>
                          {email.subject && (
                            <p className="text-sm text-slate-400 truncate max-w-xs">{email.subject}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {email.totalRecipients.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-white">{email.openCount.toLocaleString()}</span>
                          <span className="text-slate-400 text-sm ml-1">({email.openRate.toFixed(1)}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-white">{email.clickCount.toLocaleString()}</span>
                          <span className="text-slate-400 text-sm ml-1">({email.clickRate.toFixed(1)}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {email.sentAt ? formatDate(email.sentAt) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/marketing/email/${email.id}`}
                          className="text-accent hover:text-pink-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface-secondary/50 rounded-xl p-12 border border-border text-center">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucune campagne courriel liée</h3>
              <p className="text-slate-400 mb-4">Les campagnes emails mentionnant cette campagne apparaîtront ici</p>
              <Link
                href="/marketing/email/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
              >
                + Créer une campagne courriel
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Onglet Donateurs */}
      {activeTab === "donors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Donateurs de cette campagne</h2>
            <div className="text-sm text-slate-400">
              {campaign.donorsWithDetails?.length || 0} donateur(s) • {formatCurrency(campaign.totalRaised)} collecté
            </div>
          </div>

          {campaign.donorsWithDetails && campaign.donorsWithDetails.length > 0 ? (
            <div className="bg-surface-secondary/50 rounded-xl border border-border overflow-hidden">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-surface-primary/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Donateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Niveau
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Total donné
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Nb dons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Premier don
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Dernier don
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {campaign.donorsWithDetails.map((cd) => (
                    <tr key={cd.id} className="hover:bg-surface-tertiary/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {cd.donor?.firstName?.[0]}{cd.donor?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {cd.donor?.firstName} {cd.donor?.lastName}
                              {cd.isMajorDonor && (
                                <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-warning text-xs rounded-full">
                                  Major
                                </span>
                              )}
                              {cd.isRecurring && (
                                <span className="ml-1 px-2 py-0.5 bg-success/20 text-success-light text-xs rounded-full">
                                  Récurrent
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-slate-400">{cd.donor?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-brand/20 text-brand-light text-xs font-medium rounded-full">
                          {cd.donorLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {formatCurrency(cd.totalDonated)}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {cd.donationCount}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {cd.firstDonationDate ? formatDate(cd.firstDonationDate) : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {cd.lastDonationDate ? formatDate(cd.lastDonationDate) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/donors/${cd.donor?.id}`}
                          className="text-accent hover:text-pink-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-surface-secondary/50 rounded-xl p-12 border border-border text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucun donateur</h3>
              <p className="text-slate-400">Les donateurs apparaîtront ici une fois les premiers dons reçus</p>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
