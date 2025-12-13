"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SuperAdminWrapper from "@/components/super-admin/SuperAdminWrapper";
import {
  Building2,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Globe,
  Calendar,
  Save,
  X,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  databaseUrl: string | null;
  members: Array<{
    id: string;
    role: string;
    createdAt: string;
    adminUser: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
    };
  }>;
  _count: {
    members: number;
    dashboardLayouts: number;
  };
}

export default function SuperAdminOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Organization>>({});

  useEffect(() => {
    if (params.id) {
      fetchOrganization();
    }
  }, [params.id]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setOrganization(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/super-admin/organizations/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setOrganization(data.data);
        setEditing(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette organisation ?")) return;

    try {
      const response = await fetch(`/api/super-admin/organizations/${params.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        router.push("/super-admin/organizations");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "FREE": return "bg-slate-500/20 text-slate-300";
      case "STARTER": return "bg-blue-500/20 text-blue-300";
      case "PROFESSIONAL": return "bg-purple-500/20 text-purple-300";
      case "ENTERPRISE": return "bg-amber-500/20 text-amber-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/20 text-green-300";
      case "INACTIVE": return "bg-slate-500/20 text-slate-300";
      case "SUSPENDED": return "bg-red-500/20 text-red-300";
      case "PENDING": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-slate-500/20 text-slate-300";
    }
  };

  if (loading) {
    return (
      <SuperAdminWrapper>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          <div className="h-64 bg-slate-700 rounded-2xl"></div>
        </div>
      </SuperAdminWrapper>
    );
  }

  if (!organization) {
    return (
      <SuperAdminWrapper>
        <div className="text-center py-12">
          <p className="text-slate-400">Organisation non trouvée</p>
          <Link href="/super-admin/organizations" className="text-purple-400 hover:underline mt-2 inline-block">
            Retour à la liste
          </Link>
        </div>
      </SuperAdminWrapper>
    );
  }

  return (
    <SuperAdminWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/super-admin/organizations"
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
              <p className="text-slate-400">{organization.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(organization);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Sauvegarder
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">
                Informations générales
              </h2>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
                      <select
                        value={formData.plan || "FREE"}
                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="FREE">Free</option>
                        <option value="STARTER">Starter</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Statut</label>
                      <select
                        value={formData.status || "ACTIVE"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="ACTIVE">Actif</option>
                        <option value="INACTIVE">Inactif</option>
                        <option value="SUSPENDED">Suspendu</option>
                        <option value="PENDING">En attente</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{organization.name}</p>
                      <p className="text-sm text-slate-400">{organization.slug}</p>
                    </div>
                  </div>
                  
                  {organization.description && (
                    <p className="text-slate-300">{organization.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {organization.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {organization.email}
                      </div>
                    )}
                    {organization.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {organization.phone}
                      </div>
                    )}
                    {organization.website && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Globe className="w-4 h-4 text-slate-400" />
                        {organization.website}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Créée le {new Date(organization.createdAt).toLocaleDateString("fr-CA")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Membres ({organization._count.members})
                </h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm">
                  <UserPlus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              {organization.members.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  Aucun membre dans cette organisation
                </p>
              ) : (
                <div className="space-y-3">
                  {organization.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-300 font-medium">
                            {member.adminUser.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.adminUser.name}</p>
                          <p className="text-xs text-slate-400">{member.adminUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-600 text-slate-300">
                          {member.role}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(member.adminUser.status)}`}>
                          {member.adminUser.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Statut</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Plan</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPlanColor(organization.plan)}`}>
                    {organization.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Statut</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(organization.status)}`}>
                    {organization.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Membres</span>
                  <span className="text-white font-medium">{organization._count.members}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Dashboards</span>
                  <span className="text-white font-medium">{organization._count.dashboardLayouts}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Base de données</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Type</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${organization.databaseUrl ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-300"}`}>
                    {organization.databaseUrl ? "Dédiée" : "Partagée"}
                  </span>
                </div>
                {organization.databaseUrl && (
                  <div className="pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/organizations/${organization.id}/database`);
                          const data = await response.json();
                          if (data.success) {
                            alert(`URL de la base de données:\n${data.databaseUrl || "Non configurée"}`);
                          }
                        } catch (error) {
                          console.error("Erreur:", error);
                        }
                      }}
                      className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-left text-sm"
                    >
                      Voir l&apos;URL de la BD
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-left text-sm">
                  Voir les données
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-left text-sm">
                  Exporter les rapports
                </button>
                <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-left text-sm">
                  Envoyer une notification
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminWrapper>
  );
}
