"use client";

import { useEffect, useState } from "react";
import SuperAdminWrapper from "@/components/super-admin/SuperAdminWrapper";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  organizations: {
    total: number;
    active: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  };
  adminUsers: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  donors: {
    total: number;
  };
  donations: {
    total: number;
    totalAmount: number;
    averageAmount: number;
    maxAmount: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    description: string;
    createdAt: string;
    adminUser: {
      name: string;
      email: string;
    };
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/super-admin/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "bg-slate-500/20 text-slate-300";
      case "STARTER":
        return "bg-blue-500/20 text-blue-300";
      case "PROFESSIONAL":
        return "bg-purple-500/20 text-purple-300";
      case "ENTERPRISE":
        return "bg-amber-500/20 text-amber-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-300";
      case "INACTIVE":
        return "bg-slate-500/20 text-slate-300";
      case "SUSPENDED":
        return "bg-red-500/20 text-red-300";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case "UPDATE":
        return <Activity className="w-4 h-4 text-blue-400" />;
      case "DELETE":
        return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      case "LOGIN":
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <SuperAdminWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Vue d&apos;ensemble de la plateforme Cause Pilot AI
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">Organisations</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats.organizations.total}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  {stats.organizations.active} actives
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">Utilisateurs Admin</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats.adminUsers.total}
                </p>
                <p className="text-sm text-green-400 mt-1">
                  {stats.adminUsers.active} actifs
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">Total Collecté</span>
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(stats.donations.totalAmount)}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {stats.donations.total} dons
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">Donateurs</span>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-pink-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  {stats.donors.total}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {stats.campaigns.active} campagnes actives
                </p>
              </div>
            </div>

            {/* Plans Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Distribution par Plan
                </h2>
                <div className="space-y-3">
                  {Object.entries(stats.organizations.byPlan).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPlanColor(plan)}`}>
                          {plan}
                        </span>
                      </div>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Rôles Admin
                </h2>
                <div className="space-y-3">
                  {Object.entries(stats.adminUsers.byRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-slate-300">{role}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Organizations & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Organizations */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Organisations Récentes
                  </h2>
                  <Link
                    href="/super-admin/organizations"
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Voir tout
                  </Link>
                </div>
                <div className="space-y-3">
                  {stats.recentOrganizations.map((org) => (
                    <Link
                      key={org.id}
                      href={`/super-admin/organizations/${org.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                    >
                      <div>
                        <p className="text-white font-medium">{org.name}</p>
                        <p className="text-xs text-slate-400">{org.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPlanColor(org.plan)}`}>
                          {org.plan}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(org.status)}`}>
                          {org.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Activité Récente
                  </h2>
                  <Link
                    href="/super-admin/audit"
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Voir tout
                  </Link>
                </div>
                <div className="space-y-3">
                  {stats.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">
                            {log.adminUser?.name || log.adminUser?.email}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">Impossible de charger les statistiques</p>
          </div>
        )}
      </div>
    </SuperAdminWrapper>
  );
}
