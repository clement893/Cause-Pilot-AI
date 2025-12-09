"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  Calendar,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Heart,
  Mail,
  BarChart3,
  PlusCircle,
  UserPlus,
  Megaphone,
  Bot,
} from "lucide-react";

interface DashboardData {
  kpis: {
    totalDonors: number;
    newDonorsThisMonth: number;
    donorGrowth: number;
    activeDonors: number;
    totalDonations: number;
    donationsThisMonth: number;
    donationsThisYear: number;
    donationGrowth: number;
    averageDonation: number;
    recurringDonations: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalForms: number;
    activeForms: number;
  };
  charts: {
    monthlyDonations: Array<{ month: string; amount: number; count: number }>;
    donorSegments: Array<{ segment: string; count: number }>;
  };
  recent: {
    donations: Array<{
      id: string;
      amount: number;
      donorName: string;
      donorEmail?: string;
      date: string;
      isRecurring: boolean;
      isAnonymous: boolean;
    }>;
    donors: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      createdAt: string;
      totalDonations: number;
    }>;
    campaigns: Array<{
      id: string;
      name: string;
      goalAmount: number | null;
      totalRaised: number;
      donorCount: number;
      progress: number;
      endDate: string | null;
    }>;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculer le max pour le graphique
  const maxDonation = data?.charts.monthlyDonations
    ? Math.max(...data.charts.monthlyDonations.map((d) => d.amount), 1)
    : 1;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Vue d&apos;ensemble de votre activité philanthropique
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Chargement du dashboard...</p>
            </div>
          </div>
        ) : data ? (
          <>
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Donateurs */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-sm font-medium ${
                      data.kpis.donorGrowth >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {data.kpis.donorGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(data.kpis.donorGrowth)}%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white">
                  {data.kpis.totalDonors.toLocaleString()}
                </h3>
                <p className="text-gray-400 text-sm mt-1">Donateurs totaux</p>
                <p className="text-purple-600 text-xs mt-2">
                  +{data.kpis.newDonorsThisMonth} ce mois
                </p>
              </div>

              {/* Dons ce mois */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-sm font-medium ${
                      data.kpis.donationGrowth >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {data.kpis.donationGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(data.kpis.donationGrowth)}%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white">
                  {formatCurrency(data.kpis.donationsThisMonth)}
                </h3>
                <p className="text-gray-400 text-sm mt-1">Dons ce mois</p>
                <p className="text-green-600 text-xs mt-2">
                  {formatCurrency(data.kpis.donationsThisYear)} cette année
                </p>
              </div>

              {/* Campagnes actives */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white">
                  {data.kpis.activeCampaigns}
                </h3>
                <p className="text-gray-400 text-sm mt-1">Campagnes actives</p>
                <p className="text-blue-600 text-xs mt-2">
                  {data.kpis.totalCampaigns} au total
                </p>
              </div>

              {/* Don moyen */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white">
                  {formatCurrency(data.kpis.averageDonation)}
                </h3>
                <p className="text-gray-400 text-sm mt-1">Don moyen</p>
                <p className="text-pink-600 text-xs mt-2">
                  {data.kpis.recurringDonations} dons récurrents
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Graphique des dons */}
              <div className="lg:col-span-2 bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    Évolution des dons
                  </h2>
                  <Link
                    href="/analytics"
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir plus <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="h-64">
                  <div className="flex items-end justify-between h-full gap-2">
                    {data.charts.monthlyDonations.map((month, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:from-purple-700 hover:to-purple-500 cursor-pointer group relative"
                          style={{
                            height: `${Math.max((month.amount / maxDonation) * 100, 5)}%`,
                          }}
                        >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(month.amount)}
                            <br />
                            {month.count} dons
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-2 truncate w-full text-center">
                          {month.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Actions rapides
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/donors/new"
                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Nouveau donateur</p>
                      <p className="text-xs text-gray-400">Ajouter un contact</p>
                    </div>
                  </Link>
                  <Link
                    href="/forms/new"
                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlusCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Formulaire de don</p>
                      <p className="text-xs text-gray-400">Créer un formulaire</p>
                    </div>
                  </Link>
                  <Link
                    href="/campaigns/new"
                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Nouvelle campagne</p>
                      <p className="text-xs text-gray-400">Lancer une collecte</p>
                    </div>
                  </Link>
                  <Link
                    href="/copilot"
                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Copilote IA</p>
                      <p className="text-xs text-gray-400">Poser une question</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Dons récents */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Dons récents
                  </h2>
                  <Link
                    href="/donors"
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {data.recent.donations.slice(0, 5).map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {donation.isAnonymous ? "Donateur anonyme" : donation.donorName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(donation.date)}
                            {donation.isRecurring && (
                              <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                Récurrent
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(donation.amount)}
                      </span>
                    </div>
                  ))}
                  {data.recent.donations.length === 0 && (
                    <p className="text-center text-gray-400 py-8">
                      Aucun don récent
                    </p>
                  )}
                </div>
              </div>

              {/* Campagnes en cours */}
              <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Campagnes en cours
                  </h2>
                  <Link
                    href="/campaigns"
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {data.recent.campaigns.map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/campaigns/${campaign.id}`}
                      className="block p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{campaign.name}</h3>
                        <span className="text-sm text-gray-400">
                          {campaign.donorCount} donateurs
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {formatCurrency(campaign.totalRaised)} collectés
                        </span>
                        {campaign.goalAmount && (
                          <span className="text-gray-400">
                            Objectif: {formatCurrency(campaign.goalAmount)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                  {data.recent.campaigns.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400">Aucune campagne active</p>
                      <Link
                        href="/campaigns/new"
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2 inline-block"
                      >
                        Créer une campagne
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nouveaux donateurs */}
            <div className="mt-8 bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Nouveaux donateurs
                </h2>
                <Link
                  href="/donors"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                >
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {data.recent.donors.map((donor) => (
                  <Link
                    key={donor.id}
                    href={`/donors/${donor.id}`}
                    className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-center"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600 font-semibold">
                        {donor.firstName?.[0]}
                        {donor.lastName?.[0]}
                      </span>
                    </div>
                    <p className="font-medium text-white truncate">
                      {donor.firstName} {donor.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{donor.email}</p>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {formatCurrency(donor.totalDonations)}
                    </p>
                  </Link>
                ))}
                {data.recent.donors.length === 0 && (
                  <div className="col-span-5 text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">Aucun nouveau donateur</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Erreur lors du chargement des données</p>
            <button
              onClick={handleRefresh}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Réessayer
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
