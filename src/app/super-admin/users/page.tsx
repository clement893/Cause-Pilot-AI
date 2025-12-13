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
  Plus,
  X,
  Building2,
  Clock,
  Trash2,
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

interface AdminInvitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
  invitedByName: string | null;
  Organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  AdminUser: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
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

      const response = await fetch(`/api/super-admin/users?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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

  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const response = await fetch("/api/super-admin/invitations?status=PENDING", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cette invitation ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/invitations/${invitationId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        fetchInvitations();
      } else {
        alert(data.error || "Erreur lors de la révocation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la révocation");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Utilisateurs Admin</h1>
            <p className="text-slate-400 mt-1">
              Gérez les utilisateurs ayant accès à l&apos;administration
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Inviter un utilisateur
          </button>
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

        {/* Invitations en attente */}
        {invitations.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-yellow-300">
                  Invitations en attente ({invitations.length})
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-white font-medium">{invitation.email}</span>
                        {invitation.role && (
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(invitation.role)}`}>
                            {invitation.role}
                          </span>
                        )}
                        {invitation.Organization && (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300">
                            {invitation.Organization.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span>
                          Invité par: {invitation.invitedByName || invitation.AdminUser.name || invitation.AdminUser.email}
                        </span>
                        <span>•</span>
                        <span>
                          Expire le: {new Date(invitation.expiresAt).toLocaleDateString("fr-CA")}
                        </span>
                        <span>•</span>
                        <span>
                          Créée le: {new Date(invitation.createdAt).toLocaleDateString("fr-CA")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeInvitation(invitation.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                      title="Révoquer l'invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Invite Modal */}
        {showInviteModal && (
          <InviteUserModal
            onClose={() => setShowInviteModal(false)}
            onInvited={() => {
              setShowInviteModal(false);
              fetchUsers();
              fetchInvitations();
            }}
          />
        )}
      </div>
    </SuperAdminWrapper>
  );
}

function InviteUserModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [inviteType, setInviteType] = useState<"admin" | "organization">("admin");
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    email: "",
    role: "ADMIN",
    organizationId: "",
  });

  useEffect(() => {
    if (inviteType === "organization") {
      fetchOrganizations();
    }
  }, [inviteType]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/super-admin/organizations?limit=100", {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.data.map((org: { id: string; name: string }) => ({
          id: org.id,
          name: org.name,
        })));
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/super-admin/users/invite", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          role: inviteType === "admin" ? formData.role : undefined,
          organizationId: inviteType === "organization" ? formData.organizationId : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onInvited();
      } else {
        alert(data.error || "Erreur lors de l'invitation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Inviter un utilisateur
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type d'invitation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type d&apos;invitation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInviteType("admin")}
                className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                  inviteType === "admin"
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-slate-700 bg-slate-700/50 text-slate-300 hover:border-slate-600"
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-2" />
                <p className="font-medium">Admin</p>
                <p className="text-xs mt-1">Accès administration</p>
              </button>
              <button
                type="button"
                onClick={() => setInviteType("organization")}
                className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                  inviteType === "organization"
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-slate-700 bg-slate-700/50 text-slate-300 hover:border-slate-600"
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-2" />
                <p className="font-medium">Organisation</p>
                <p className="text-xs mt-1">Accès organisation spécifique</p>
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email *{" "}
              <span className="text-xs text-slate-500">
                {inviteType === "admin" 
                  ? "(@nukleo.com uniquement pour les admins)" 
                  : "(Tous les domaines autorisés pour les membres d'organisation)"}
              </span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={inviteType === "admin" ? "utilisateur@nukleo.com" : "utilisateur@exemple.com"}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Rôle (si admin) */}
          {inviteType === "admin" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rôle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>
          )}

          {/* Organisation (si organisation) */}
          {inviteType === "organization" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Organisation *
              </label>
              <select
                required={inviteType === "organization"}
                value={formData.organizationId}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sélectionner une organisation</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || (inviteType === "organization" && !formData.organizationId)}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
