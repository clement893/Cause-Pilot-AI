"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Badge, Spinner } from "@/components/ui";
import { Donor, DonorStatus } from "@/types/donor";

const statusColors: Record<DonorStatus, "success" | "warning" | "danger" | "default" | "info"> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  LAPSED: "danger",
  DECEASED: "default",
  DO_NOT_CONTACT: "danger",
  PENDING: "info",
};

const statusLabels: Record<DonorStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  LAPSED: "Lapsé",
  DECEASED: "Décédé",
  DO_NOT_CONTACT: "Ne pas contacter",
  PENDING: "En attente",
};

const donorTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  CORPORATE: "Entreprise",
  FOUNDATION: "Fondation",
  GOVERNMENT: "Gouvernement",
  ANONYMOUS: "Anonyme",
};

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donationDate: string;
  status: string;
  paymentMethod: string;
  campaignName: string | null;
  receiptNumber: string | null;
  receiptSentAt: string | null;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
  metadata?: Record<string, unknown>;
}

interface DonorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DonorDetailPage({ params }: DonorDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "donations" | "activity" | "communications">("profile");
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [scores, setScores] = useState<{ potentialScore: number | null; churnRiskScore: number | null } | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const response = await fetch(`/api/donors/${id}`);
        const data = await response.json();

        if (data.success) {
          setDonor(data.data);
        } else {
          setError(data.error || "Donateur non trouvé");
        }
      } catch (err) {
        console.error("Error fetching donor:", err);
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchDonor();
  }, [id]);

  useEffect(() => {
    if (activeTab === "donations" && donations.length === 0) {
      fetchDonations();
    }
    if (activeTab === "activity" && activities.length === 0) {
      fetchActivities();
    }
  }, [activeTab]);

  // Récupérer les scores prédictifs
  useEffect(() => {
    const fetchScores = async () => {
      if (!id) return;
      setLoadingScores(true);
      try {
        const response = await fetch(`/api/donors/scoring?donorId=${id}&recalculate=true`);
        if (response.ok) {
          const data = await response.json();
          setScores({
            potentialScore: data.potentialScore,
            churnRiskScore: data.churnRiskScore,
          });
        }
      } catch (err) {
        console.error("Error fetching scores:", err);
      } finally {
        setLoadingScores(false);
      }
    };
    fetchScores();
  }, [id]);

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const response = await fetch(`/api/donors/${id}/donations`);
      const data = await response.json();
      if (data.success) {
        setDonations(data.data);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchActivities = async () => {
    // Simuler des activités pour le moment
    setActivities([
      { id: "1", type: "EMAIL_SENT", description: "Email de remerciement envoyé", date: new Date().toISOString() },
      { id: "2", type: "DONATION", description: "Don reçu de 100$", date: new Date(Date.now() - 86400000).toISOString() },
      { id: "3", type: "PROFILE_UPDATED", description: "Profil mis à jour", date: new Date(Date.now() - 172800000).toISOString() },
    ]);
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce donateur ?")) return;

    try {
      const response = await fetch(`/api/donors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/donors");
      }
    } catch (err) {
      console.error("Error deleting donor:", err);
    }
  };

  const formatCurrency = (amount: number, currency: string = "CAD") => {
    return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(amount);
  };

  const getEngagementScore = () => {
    if (!donor) return 0;
    let score = 0;
    if (donor.donationCount > 0) score += 20;
    if (donor.donationCount > 5) score += 20;
    if (donor.donationCount > 10) score += 10;
    if (donor.totalDonations > 100) score += 10;
    if (donor.totalDonations > 500) score += 10;
    if (donor.totalDonations > 1000) score += 10;
    if (donor.consentEmail) score += 10;
    if (donor.lastDonationDate) {
      const daysSinceLastDonation = Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastDonation < 90) score += 10;
    }
    return Math.min(score, 100);
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getPotentialColor = (score: number | null) => {
    if (!score) return "bg-slate-500";
    if (score >= 70) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-slate-500";
  };

  const getChurnRiskColor = (score: number | null) => {
    if (!score) return "bg-slate-500";
    if (score >= 70) return "bg-red-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-green-500";
  };

  const getPotentialLabel = (score: number | null) => {
    if (!score) return "Non calculé";
    if (score >= 70) return "Haut potentiel";
    if (score >= 40) return "Potentiel moyen";
    return "Potentiel faible";
  };

  const getChurnRiskLabel = (score: number | null) => {
    if (!score) return "Non calculé";
    if (score >= 70) return "Risque élevé";
    if (score >= 40) return "Risque modéré";
    return "Risque faible";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !donor) {
    return (
      <AppLayout breadcrumbs={[{ name: "Base Donateurs", href: "/donors" }, { name: "Erreur" }]}>
        <Card className="text-center max-w-md mx-auto bg-slate-900 border-slate-800">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-semibold text-white">{error || "Donateur non trouvé"}</h3>
          <div className="mt-4">
            <Link href="/donors">
              <Button variant="primary">Retour à la liste</Button>
            </Link>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const engagementScore = getEngagementScore();

  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Base Donateurs", href: "/donors" },
        { name: `${donor.firstName} ${donor.lastName}` }
      ]}
    >
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {donor.firstName?.charAt(0)}{donor.lastName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {donor.firstName} {donor.lastName}
                </h1>
                <Badge variant={statusColors[donor.status]}>
                  {statusLabels[donor.status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {donorTypeLabels[donor.donorType]} • Créé le {new Date(donor.createdAt).toLocaleDateString("fr-CA")}
              </p>
              {donor.email && (
                <p className="mt-1 text-sm text-gray-300">{donor.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/donors/${id}/receipts`}>
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reçus fiscaux
              </Button>
            </Link>
            <Link href={`/donors/${id}/edit`}>
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Scoring Prédictif */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Score de Potentiel Major Gift */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Potentiel Major Gift</p>
                <p className="text-xs text-gray-400">Probabilité de don majeur</p>
              </div>
            </div>
            <div className="text-right">
              {loadingScores ? (
                <div className="animate-pulse bg-slate-700 h-8 w-16 rounded"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{scores?.potentialScore || 0}</p>
                  <Badge variant={scores?.potentialScore && scores.potentialScore >= 70 ? "success" : scores?.potentialScore && scores.potentialScore >= 40 ? "warning" : "default"} className="text-xs">
                    {getPotentialLabel(scores?.potentialScore || null)}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getPotentialColor(scores?.potentialScore || null)} transition-all duration-500`}
              style={{ width: `${scores?.potentialScore || 0}%` }}
            />
          </div>
        </Card>

        {/* Score de Risque de Churn */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Risque de Churn</p>
                <p className="text-xs text-gray-400">Probabilité d&apos;attrition</p>
              </div>
            </div>
            <div className="text-right">
              {loadingScores ? (
                <div className="animate-pulse bg-slate-700 h-8 w-16 rounded"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{scores?.churnRiskScore || 0}</p>
                  <Badge variant={scores?.churnRiskScore && scores.churnRiskScore >= 70 ? "danger" : scores?.churnRiskScore && scores.churnRiskScore >= 40 ? "warning" : "success"} className="text-xs">
                    {getChurnRiskLabel(scores?.churnRiskScore || null)}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getChurnRiskColor(scores?.churnRiskScore || null)} transition-all duration-500`}
              style={{ width: `${scores?.churnRiskScore || 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total des dons</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(donor.totalDonations)}</p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Nombre de dons</p>
          <p className="text-xl font-bold text-white mt-1">{donor.donationCount}</p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Don moyen</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(donor.averageDonation)}</p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Dernier don</p>
          <p className="text-xl font-bold text-white mt-1">
            {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString("fr-CA") : "-"}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Score d&apos;engagement</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getEngagementColor(engagementScore)} transition-all`}
                style={{ width: `${engagementScore}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white">{engagementScore}%</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-6">
          {[
            { key: "profile", label: "Profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
            { key: "donations", label: "Historique des dons", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { key: "activity", label: "Activité", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { key: "communications", label: "Communications", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-500"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Informations de contact
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-white">{donor.email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Téléphone</dt>
                  <dd className="mt-1 text-sm text-white">{donor.phone || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Mobile</dt>
                  <dd className="mt-1 text-sm text-white">{donor.mobile || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Date de naissance</dt>
                  <dd className="mt-1 text-sm text-white">
                    {donor.dateOfBirth ? new Date(donor.dateOfBirth).toLocaleDateString("fr-CA") : "-"}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Address */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Adresse
              </h3>
              <address className="not-italic text-sm text-white">
                {donor.address && <div>{donor.address}</div>}
                {donor.address2 && <div>{donor.address2}</div>}
                {(donor.city || donor.state || donor.postalCode) && (
                  <div>
                    {donor.city}{donor.city && donor.state && ", "}{donor.state} {donor.postalCode}
                  </div>
                )}
                {donor.country && <div>{donor.country}</div>}
                {!donor.address && !donor.city && <span className="text-gray-500">Aucune adresse renseignée</span>}
              </address>
            </Card>

            {/* Professional Info */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Informations professionnelles
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-400">Profession</dt>
                  <dd className="mt-1 text-sm text-white">{donor.profession || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Employeur</dt>
                  <dd className="mt-1 text-sm text-white">{donor.employer || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Titre du poste</dt>
                  <dd className="mt-1 text-sm text-white">{donor.jobTitle || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400">Secteur</dt>
                  <dd className="mt-1 text-sm text-white">{donor.industry || "-"}</dd>
                </div>
              </dl>
            </Card>

            {/* Notes */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {donor.notes || <span className="text-gray-500 italic">Aucune note</span>}
              </p>
            </Card>
          </div>

          {/* Right Column - Stats & Quick Info */}
          <div className="space-y-6">
            {/* Consent Status */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Consentements</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Email</span>
                  {donor.consentEmail ? (
                    <Badge variant="success">Autorisé</Badge>
                  ) : (
                    <Badge variant="default">Non autorisé</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Téléphone</span>
                  {donor.consentPhone ? (
                    <Badge variant="success">Autorisé</Badge>
                  ) : (
                    <Badge variant="default">Non autorisé</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Courrier</span>
                  {donor.consentMail ? (
                    <Badge variant="success">Autorisé</Badge>
                  ) : (
                    <Badge variant="default">Non autorisé</Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Tags & Segment */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Classification</h3>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-400 mb-2">Segment</dt>
                  <dd>
                    {donor.segment ? (
                      <Badge variant="info">{donor.segment}</Badge>
                    ) : (
                      <span className="text-sm text-gray-500">Non défini</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-400 mb-2">Tags</dt>
                  <dd className="flex flex-wrap gap-2">
                    {donor.tags && donor.tags.length > 0 ? (
                      donor.tags.map((tag, index) => (
                        <Badge key={index} variant="default">{tag}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Aucun tag</span>
                    )}
                  </dd>
                </div>
                {donor.source && (
                  <div>
                    <dt className="text-sm font-medium text-gray-400 mb-2">Source</dt>
                    <dd className="text-sm text-white">{donor.source}</dd>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-900 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Envoyer un email
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enregistrer un don
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Ajouter un tag
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Ajouter une note
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "donations" && (
        <Card className="bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Historique des dons</h3>
            <Button variant="primary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouveau don
            </Button>
          </div>
          
          {loadingDonations ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-gray-400">Aucun don enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Montant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Campagne</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Méthode</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Statut</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Reçu</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-white">
                        {new Date(donation.donationDate).toLocaleDateString("fr-CA")}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-white">
                        {formatCurrency(donation.amount, donation.currency)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {donation.campaignName || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {donation.paymentMethod}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={donation.status === "COMPLETED" ? "success" : "warning"}>
                          {donation.status === "COMPLETED" ? "Complété" : donation.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {donation.receiptSentAt ? (
                          <Badge variant="success">Envoyé</Badge>
                        ) : (
                          <Badge variant="default">Non envoyé</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "activity" && (
        <Card className="bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Timeline d&apos;activité</h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === "DONATION" ? "bg-green-500/20 text-green-400" :
                    activity.type === "EMAIL_SENT" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {activity.type === "DONATION" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {activity.type === "EMAIL_SENT" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {activity.type === "PROFILE_UPDATED" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-full bg-slate-700 my-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-white">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleDateString("fr-CA")} à {new Date(activity.date).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "communications" && (
        <Card className="bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Historique des communications</h3>
            <Button variant="primary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Envoyer un email
            </Button>
          </div>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-gray-400">Aucune communication enregistrée</p>
            <p className="text-sm text-gray-500">Les emails envoyés via les campagnes marketing apparaîtront ici</p>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}
