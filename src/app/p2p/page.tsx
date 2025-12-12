"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  Trophy,
  Target,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Award,
} from "lucide-react";

interface Fundraiser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  slug: string;
  title: string;
  photoUrl: string | null;
  goalAmount: number;
  totalRaised: number;
  donorCount: number;
  status: string;
  points: number;
  level: number;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    slug: string;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  goalAmount: number;
  totalRaised: number;
  memberCount: number;
  status: string;
  _count: { members: number };
}

interface Stats {
  totalFundraisers: number;
  activeFundraisers: number;
  totalTeams: number;
  totalRaised: number;
  totalDonors: number;
}

export default function P2PPage() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fundraisers" | "teams">("fundraisers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const [fundraisersRes, teamsRes] = await Promise.all([
        fetch(`/api/p2p/fundraisers?${params}`),
        fetch(`/api/p2p/teams?${params}`),
      ]);

      const fundraisersData = await fundraisersRes.json();
      const teamsData = await teamsRes.json();

      setFundraisers(fundraisersData.fundraisers || []);
      setTeams(teamsData.teams || []);

      // Calculer les stats
      const allFundraisers = fundraisersData.fundraisers || [];
      setStats({
        totalFundraisers: fundraisersData.pagination?.total || allFundraisers.length,
        activeFundraisers: allFundraisers.filter((f: Fundraiser) => f.status === "ACTIVE").length,
        totalTeams: teamsData.pagination?.total || (teamsData.teams || []).length,
        totalRaised: allFundraisers.reduce((sum: number, f: Fundraiser) => sum + f.totalRaised, 0),
        totalDonors: allFundraisers.reduce((sum: number, f: Fundraiser) => sum + f.donorCount, 0),
      });
    } catch (error) {
      console.error("Error fetching P2P data:", error);
    } finally {
      setLoading(false);
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
      case "PAUSED":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "COMPLETED":
        return <Trophy className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
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

  const filteredFundraisers = fundraisers.filter(
    (f) =>
      f.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbs = [{ name: "Campagnes P2P", href: "/p2p" }];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Campagnes Peer-to-Peer</h1>
            <p className="text-gray-400 mt-1">
              Gérez les pages de collecte individuelles et les équipes
            </p>
          </div>
          <Link
            href="/p2p/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all w-fit"
          >
            <Plus className="w-4 h-4" />
            Nouvelle page P2P
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs">Fundraisers</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalFundraisers}</p>
              <p className="text-xs text-green-400">{stats.activeFundraisers} actifs</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <UserPlus className="w-4 h-4" />
                <span className="text-xs">Équipes</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs">Total collecté</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {stats.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Donateurs</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.totalDonors}</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Award className="w-4 h-4" />
                <span className="text-xs">Don moyen</span>
              </div>
              <p className="text-2xl font-bold text-pink-400">
                {stats.totalDonors > 0
                  ? (stats.totalRaised / stats.totalDonors).toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })
                  : "0 $"}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("fundraisers")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "fundraisers"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Fundraisers ({fundraisers.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "teams"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Équipes ({teams.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvé</option>
              <option value="ACTIVE">Actif</option>
              <option value="PAUSED">En pause</option>
              <option value="COMPLETED">Terminé</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : activeTab === "fundraisers" ? (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            {filteredFundraisers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-slate-700">
                      <th className="px-6 py-4 font-medium">Fundraiser</th>
                      <th className="px-6 py-4 font-medium">Campagne</th>
                      <th className="px-6 py-4 font-medium">Objectif</th>
                      <th className="px-6 py-4 font-medium">Collecté</th>
                      <th className="px-6 py-4 font-medium">Donateurs</th>
                      <th className="px-6 py-4 font-medium">Statut</th>
                      <th className="px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredFundraisers.map((fundraiser) => {
                      const progress = fundraiser.goalAmount > 0
                        ? Math.min((fundraiser.totalRaised / fundraiser.goalAmount) * 100, 100)
                        : 0;

                      return (
                        <tr key={fundraiser.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                {fundraiser.photoUrl ? (
                                  <img
                                    src={fundraiser.photoUrl}
                                    alt={fundraiser.firstName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  `${fundraiser.firstName[0]}${fundraiser.lastName[0]}`
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {fundraiser.firstName} {fundraiser.lastName}
                                </p>
                                <p className="text-sm text-gray-400">{fundraiser.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white">{fundraiser.campaign?.name || "-"}</p>
                            {fundraiser.team && (
                              <p className="text-xs text-purple-400">Équipe: {fundraiser.team.name}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {fundraiser.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-green-400 font-medium">
                                {fundraiser.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                              </p>
                              <div className="w-24 h-1.5 bg-slate-700 rounded-full mt-1">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white">{fundraiser.donorCount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${getStatusColor(fundraiser.status)}`}>
                              {getStatusIcon(fundraiser.status)}
                              {getStatusLabel(fundraiser.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/p2p/fundraisers/${fundraiser.id}`}
                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/fundraise/${fundraiser.slug}`}
                                target="_blank"
                                className="p-2 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
                                title="Voir la page publique"
                              >
                                <Target className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucun fundraiser</h3>
                <p className="text-gray-400 mb-4">Commencez par créer une page de collecte P2P</p>
                <Link
                  href="/p2p/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer une page
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => {
                const progress = team.goalAmount > 0
                  ? Math.min((team.totalRaised / team.goalAmount) * 100, 100)
                  : 0;

                return (
                  <Link
                    key={team.id}
                    href={`/p2p/teams/${team.id}`}
                    className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-pink-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">{team.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(team.status)}`}>
                        {getStatusLabel(team.status)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Progression</span>
                          <span className="text-white">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Collecté</span>
                        <span className="text-green-400 font-medium">
                          {team.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Objectif</span>
                        <span className="text-white">
                          {team.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Membres</span>
                        <span className="text-white">{team._count?.members || team.memberCount}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16">
                <Trophy className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Aucune équipe</h3>
                <p className="text-gray-400">Les équipes apparaîtront ici</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
