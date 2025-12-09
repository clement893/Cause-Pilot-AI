"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { Shield, Plus, Edit, Trash2, Users, Check, X, Lock } from "lucide-react";

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Permission[];
  userCount: number;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", color: "#6366f1" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      const data = await res.json();
      setPermissions(data.permissions || []);
      setGroupedPermissions(data.grouped || {});
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const initializePermissions = async () => {
    try {
      const res = await fetch("/api/admin/permissions?action=seed", {
        method: "POST",
      });
      if (res.ok) {
        fetchRoles();
        fetchPermissions();
        alert("Permissions et rôles initialisés avec succès !");
      }
    } catch (error) {
      console.error("Error initializing permissions:", error);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map((p) => p.id));
  };

  const handleCreateRole = async () => {
    if (!newRole.name) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRole,
          permissionIds: selectedPermissions,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewRole({ name: "", description: "", color: "#6366f1" });
        setSelectedPermissions([]);
        fetchRoles();
      }
    } catch (error) {
      console.error("Error creating role:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionIds: selectedPermissions,
        }),
      });

      if (res.ok) {
        fetchRoles();
        alert("Permissions mises à jour avec succès !");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rôle ?")) return;

    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRoles();
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const moduleLabels: Record<string, string> = {
    donors: "Base Donateurs",
    campaigns: "Campagnes",
    forms: "Formulaires",
    marketing: "Marketing",
    analytics: "Analytics",
    p2p: "P2P",
    copilot: "Copilote IA",
    admin: "Administration",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Link href="/admin" className="hover:text-white">Administration</Link>
                <span>/</span>
                <span className="text-white">Rôles & Permissions</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Gestion des rôles</h1>
            </div>
            <div className="flex gap-3">
              {permissions.length === 0 && (
                <button
                  onClick={initializePermissions}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  Initialiser les permissions
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nouveau rôle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h2 className="text-lg font-semibold text-white">Rôles</h2>
                </div>
                <div className="divide-y divide-slate-800">
                  {loading ? (
                    <div className="p-4 text-center text-gray-400">Chargement...</div>
                  ) : roles.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      Aucun rôle. Cliquez sur &quot;Initialiser les permissions&quot; pour commencer.
                    </div>
                  ) : (
                    roles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedRole?.id === role.id
                            ? "bg-purple-500/10 border-l-2 border-purple-500"
                            : "hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{role.name}</span>
                                {role.isSystem && (
                                  <Lock className="w-3 h-3 text-gray-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {role.userCount} utilisateur{role.userCount > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          {!role.isSystem && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRole(role.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedRole ? `Permissions - ${selectedRole.name}` : "Sélectionnez un rôle"}
                  </h2>
                  {selectedRole && !selectedRole.isSystem && (
                    <button
                      onClick={handleUpdatePermissions}
                      disabled={saving}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  )}
                </div>
                
                {selectedRole ? (
                  <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                    {selectedRole.isSystem && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Ce rôle système ne peut pas être modifié.
                      </div>
                    )}
                    
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module}>
                        <h3 className="text-sm font-medium text-gray-400 uppercase mb-3">
                          {moduleLabels[module] || module}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map((perm) => {
                            const isSelected = selectedPermissions.includes(perm.id);
                            return (
                              <button
                                key={perm.id}
                                onClick={() => !selectedRole.isSystem && togglePermission(perm.id)}
                                disabled={selectedRole.isSystem}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  isSelected
                                    ? "bg-purple-500/10 border-purple-500/50 text-white"
                                    : "bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600"
                                } ${selectedRole.isSystem ? "cursor-not-allowed opacity-60" : ""}`}
                              >
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center ${
                                    isSelected ? "bg-purple-500" : "bg-slate-700"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm">{perm.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Sélectionnez un rôle pour voir et modifier ses permissions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Créer un nouveau rôle</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Ex: Gestionnaire de campagnes"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Description du rôle..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Couleur</label>
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="w-full h-10 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Permissions</label>
                <div className="max-h-60 overflow-y-auto space-y-4">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                        {moduleLabels[module] || module}
                      </h4>
                      <div className="space-y-1">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-300">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedPermissions([]);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name || saving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer le rôle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
