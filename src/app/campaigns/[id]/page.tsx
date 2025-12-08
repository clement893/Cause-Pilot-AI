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

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <AppLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout title="Campagne non trouvée">
        <div className="text-center py-12">
          <p className="text-slate-400">Cette campagne n&apos;existe pas.</p>
          <Link href="/campaigns" className="text-pink-400 hover:underline mt-4 inline-block">
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
              className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progression */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Progression de la collecte</h2>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Collecté</span>
                <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
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
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            {campaign.shortDescription && (
              <p className="text-slate-300 font-medium mb-4">{campaign.shortDescription}</p>
            )}
            <p className="text-slate-400 whitespace-pre-wrap">
              {campaign.description || "Aucune description"}
            </p>
          </div>

          {/* Statistiques */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Statistiques</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{campaign.donorCount}</p>
                <p className="text-sm text-slate-400">Donateurs</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{campaign.donationCount}</p>
                <p className="text-sm text-slate-400">Dons</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{formatCurrency(campaign.averageDonation)}</p>
                <p className="text-sm text-slate-400">Don moyen</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{formatCurrency(campaign.largestDonation)}</p>
                <p className="text-sm text-slate-400">Plus grand don</p>
              </div>
            </div>
          </div>

          {/* Jalons */}
          {campaign.milestones && campaign.milestones.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Jalons</h2>
              
              <div className="space-y-4">
                {campaign.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      milestone.isCompleted ? "bg-green-500/10" : "bg-slate-700/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        milestone.isCompleted ? "bg-green-500" : "bg-slate-600"
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
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Statut</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Statut actuel</p>
                <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm font-medium">
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </span>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-2">Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.status === "DRAFT" && (
                    <button
                      onClick={() => handleStatusChange("ACTIVE")}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Lancer
                    </button>
                  )}
                  {campaign.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={() => handleStatusChange("PAUSED")}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => handleStatusChange("COMPLETED")}
                        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Terminer
                      </button>
                    </>
                  )}
                  {campaign.status === "PAUSED" && (
                    <button
                      onClick={() => handleStatusChange("ACTIVE")}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Reprendre
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
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
                      <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Options</h2>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Publique</span>
                <span className={campaign.isPublic ? "text-green-400" : "text-slate-500"}>
                  {campaign.isPublic ? "Oui" : "Non"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">P2P autorisé</span>
                <span className={campaign.allowP2P ? "text-green-400" : "text-slate-500"}>
                  {campaign.allowP2P ? "Oui" : "Non"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Matching actif</span>
                <span className={campaign.enableMatching ? "text-green-400" : "text-slate-500"}>
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
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
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
    </AppLayout>
  );
}
