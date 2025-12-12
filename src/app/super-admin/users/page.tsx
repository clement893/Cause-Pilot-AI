"use client";

import { useEffect, useState } from "react";
import SuperAdminWrapper from "@/components/super-admin/SuperAdminWrapper";
import {
  Users,
  Search,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  managedOrganizations: Array<{
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    auditLogs: number;
    managedOrganizations: number;
  };
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/super-admin/users?${params}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-500/20 text-red-300";
      case "ADMIN": return "bg-purple-500/20 text-purple-300";
      case "MANAGER": return "bg-blue-500/20 text-blue-300";
      case "VIEWER": return "bg-slate-500/20 text-slate-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/20 text-green-300";
      case "INACTIVE": return "bg-slate-500/20 text-slate-300";
      case "SUSPENDED": return "bg-red-500/20 text-red-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <SuperAdminWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Utilisateurs Admin</h1>
          <p className="text-slate-400 mt-1">
            Gérez les utilisateurs ayant accès à l&apos;administration
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tous les rôles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>

        {/* Info */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-300">
                Accès restreint au domaine nukleo.com
              </p>
              <p className="text-xs text-purple-400 mt-1">
                Seuls les utilisateurs avec une adresse email @nukleo.com peuvent se connecter à cet espace d&apos;administration.
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Utilisateur
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Rôle
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Statut
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Organisations
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Dernière connexion
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-8 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-700 rounded w-8 ml-auto animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-300 font-medium">
                            {user.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name || "Sans nom"}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Users className="w-4 h-4" />
                        {user._count.managedOrganizations}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {user.lastLoginAt ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.lastLoginAt).toLocaleDateString("fr-CA")}
                        </div>
                      ) : (
                        <span className="text-slate-500">Jamais</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors ml-auto block">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
              {pagination.total} utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminWrapper>
  );
}
