"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  User,
  Target,
  Users,
  Trophy,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Award,
  TrendingUp,
  Share2,
} from "lucide-react";

interface Fundraiser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  slug: string;
  title: string;
  story: string | null;
  videoUrl: string | null;
  goalAmount: number;
  totalRaised: number;
  donationCount: number;
  donorCount: number;
  averageDonation: number;
  status: string;
  points: number;
  level: number;
  badges: string[];
  shareCount: number;
  viewCount: number;
  primaryColor: string;
  coverImageUrl: string | null;
  createdAt: string;
  approvedAt: string | null;
  publishedAt: string | null;
  progressPercent: number;
  campaign: {
    id: string;
    name: string;
    slug: string;
    goalAmount: number;
    totalRaised: number;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  } | null;
  donations: Array<{
    id: string;
    amount: number;
    donorName: string | null;
    isAnonymous: boolean;
    message: string | null;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    activityType: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
}

export default function FundraiserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "donations" | "activity">("overview");

  useEffect(() => {
    fetchFundraiser();
  }, [resolvedParams.id]);

  const fetchFundraiser = async () => {
    try {
      const res = await fetch(`/api/p2p/fundraisers/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setFundraiser(data);
      }
    } catch (error) {
      console.error("Error fetching fundraiser:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!fundraiser) return;

    try {
      const res = await fetch(`/api/p2p/fundraisers/${fundraiser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchFundraiser();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async () => {
    if (!fundraiser) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette page de collecte ?")) return;

    try {
      const res = await fetch(`/api/p2p/fundraisers/${fundraiser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/p2p");
      }
    } catch (error) {
      console.error("Error deleting fundraiser:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "APPROVED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "COMPLETED":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "En attente",
      APPROVED: "Approuvé",
      ACTIVE: "Actif",
      PAUSED: "En pause",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return labels[status] || status;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "DONATION_RECEIVED":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "GOAL_REACHED":
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case "MILESTONE_REACHED":
        return <Target className="w-4 h-4 text-purple-400" />;
      case "BADGE_EARNED":
        return <Award className="w-4 h-4 text-pink-400" />;
      case "SHARE_SOCIAL":
        return <Share2 className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ name: "Campagnes P2P", href: "/p2p" }]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!fundraiser) {
    return (
      <AppLayout breadcrumbs={[{ name: "Campagnes P2P", href: "/p2p" }]}>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white">Fundraiser non trouvé</h2>
          <Link href="/p2p" className="text-pink-400 hover:text-pink-300 mt-4 inline-block">
            Retour aux campagnes P2P
          </Link>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { name: "Campagnes P2P", href: "/p2p" },
    { name: `${fundraiser.firstName} ${fundraiser.lastName}`, href: `/p2p/fundraisers/${fundraiser.id}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: fundraiser.primaryColor }}
              >
                {fundraiser.photoUrl ? (
                  <img
                    src={fundraiser.photoUrl}
                    alt={fundraiser.firstName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  `${fundraiser.firstName[0]}${fundraiser.lastName[0]}`
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">
                    {fundraiser.firstName} {fundraiser.lastName}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(fundraiser.status)}`}>
                    {getStatusLabel(fundraiser.status)}
                  </span>
                </div>
                <p className="text-gray-400">{fundraiser.title}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {fundraiser.email}
                  </span>
                  {fundraiser.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {fundraiser.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {fundraiser.status === "PENDING" && (
              <button
                onClick={() => handleStatusChange("ACTIVE")}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approuver
              </button>
            )}
            {fundraiser.status === "ACTIVE" && (
              <button
                onClick={() => handleStatusChange("PAUSED")}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Mettre en pause
              </button>
            )}
            {fundraiser.status === "PAUSED" && (
              <button
                onClick={() => handleStatusChange("ACTIVE")}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Réactiver
              </button>
            )}
            <Link
              href={`/fundraise/${fundraiser.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Voir la page
            </Link>
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
              <Target className="w-4 h-4" />
              <span className="text-xs">Objectif</span>
            </div>
            <p className="text-xl font-bold text-white">
              {fundraiser.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Collecté</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              {fundraiser.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500">{fundraiser.progressPercent.toFixed(0)}% de l&apos;objectif</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Donateurs</span>
            </div>
            <p className="text-xl font-bold text-purple-400">{fundraiser.donorCount}</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="text-xs">Points</span>
            </div>
            <p className="text-xl font-bold text-pink-400">{fundraiser.points}</p>
            <p className="text-xs text-gray-500">Niveau {fundraiser.level}</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Vues</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{fundraiser.viewCount}</p>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Partages</span>
            </div>
            <p className="text-xl font-bold text-orange-400">{fundraiser.shareCount}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Progression vers l&apos;objectif</span>
            <span className="text-white font-medium">{fundraiser.progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all"
              style={{ width: `${Math.min(fundraiser.progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-400">
              {fundraiser.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })} collectés
            </span>
            <span className="text-gray-400">
              sur {fundraiser.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="flex gap-4">
            {[
              { id: "overview", label: "Aperçu", icon: User },
              { id: "donations", label: `Dons (${fundraiser.donations.length})`, icon: TrendingUp },
              { id: "activity", label: "Activité", icon: Clock },
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
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Campagne</h3>
                  <Link
                    href={`/campaigns/${fundraiser.campaign.id}`}
                    className="text-white hover:text-pink-400 transition-colors"
                  >
                    {fundraiser.campaign.name}
                  </Link>
                </div>
                {fundraiser.team && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Équipe</h3>
                    <Link
                      href={`/p2p/teams/${fundraiser.team.id}`}
                      className="text-white hover:text-pink-400 transition-colors"
                    >
                      {fundraiser.team.name}
                    </Link>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Créé le</h3>
                  <p className="text-white">
                    {new Date(fundraiser.createdAt).toLocaleDateString("fr-CA")}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Don moyen</h3>
                  <p className="text-white">
                    {fundraiser.averageDonation.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                  </p>
                </div>
              </div>

              {fundraiser.story && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Histoire</h3>
                  <p className="text-white whitespace-pre-wrap">{fundraiser.story}</p>
                </div>
              )}

              {fundraiser.badges.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Badges obtenus</h3>
                  <div className="flex flex-wrap gap-2">
                    {fundraiser.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "donations" && (
            <div>
              {fundraiser.donations.length > 0 ? (
                <div className="space-y-4">
                  {fundraiser.donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-start justify-between p-4 bg-slate-900/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {donation.isAnonymous ? "Donateur anonyme" : donation.donorName || "Donateur"}
                        </p>
                        {donation.message && (
                          <p className="text-sm text-gray-400 mt-1">&quot;{donation.message}&quot;</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(donation.createdAt).toLocaleDateString("fr-CA")}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green-400">
                        {donation.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun don reçu pour le moment</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              {fundraiser.activities.length > 0 ? (
                <div className="space-y-4">
                  {fundraiser.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg"
                    >
                      <div className="p-2 bg-slate-800 rounded-lg">
                        {getActivityIcon(activity.activityType)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-400">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.createdAt).toLocaleDateString("fr-CA")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
