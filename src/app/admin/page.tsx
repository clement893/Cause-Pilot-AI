"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { Users, Shield, Settings, FileText, Plug, Bell, Lock, Database } from "lucide-react";

interface Stats {
  users: number;
  roles: number;
  permissions: number;
  auditLogs: number;
  integrations: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    roles: 0,
    permissions: 0,
    auditLogs: 0,
    integrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, rolesRes, permissionsRes, auditRes, integrationsRes] = await Promise.all([
        fetch("/api/admin/users?limit=1"),
        fetch("/api/admin/roles"),
        fetch("/api/admin/permissions"),
        fetch("/api/admin/audit?limit=1"),
        fetch("/api/admin/integrations"),
      ]);

      const [usersData, rolesData, permissionsData, auditData, integrationsData] = await Promise.all([
        usersRes.json(),
        rolesRes.json(),
        permissionsRes.json(),
        auditRes.json(),
        integrationsRes.json(),
      ]);

      setStats({
        users: usersData.pagination?.total || 0,
        roles: rolesData.length || 0,
        permissions: permissionsData.permissions?.length || 0,
        auditLogs: auditData.pagination?.total || 0,
        integrations: integrationsData.integrations?.filter((i: { isEnabled: boolean }) => i.isEnabled).length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      title: "Utilisateurs",
      description: "Gérer les utilisateurs et leurs accès",
      href: "/admin/users",
      icon: Users,
      stat: stats.users,
      statLabel: "utilisateurs",
      color: "bg-info",
    },
    {
      title: "Rôles & Permissions",
      description: "Configurer les rôles et leurs permissions",
      href: "/admin/roles",
      icon: Shield,
      stat: stats.roles,
      statLabel: "rôles",
      color: "bg-brand",
    },
    {
      title: "Paramètres",
      description: "Configuration générale du système",
      href: "/admin/settings",
      icon: Settings,
      stat: null,
      statLabel: null,
      color: "bg-muted",
    },
    {
      title: "Journal d'audit",
      description: "Historique des actions et modifications",
      href: "/admin/audit",
      icon: FileText,
      stat: stats.auditLogs,
      statLabel: "entrées",
      color: "bg-amber-500",
    },
    {
      title: "Intégrations",
      description: "Connecter des services externes",
      href: "/admin/integrations",
      icon: Plug,
      stat: stats.integrations,
      statLabel: "actives",
      color: "bg-success",
    },
  ];

  const quickActions = [
    { label: "Inviter un utilisateur", href: "/admin/users?action=invite", icon: Users },
    { label: "Créer un rôle", href: "/admin/roles?action=create", icon: Shield },
    { label: "Voir les logs récents", href: "/admin/audit", icon: FileText },
    { label: "Configurer les emails", href: "/admin/settings?category=email", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Administration</h1>
            <p className="text-muted-foreground">
              Gérez les utilisateurs, les rôles, les permissions et les paramètres système
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/20 rounded-lg">
                  <Users className="w-6 h-6 text-info-light" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.users}
                  </p>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/20 rounded-lg">
                  <Shield className="w-6 h-6 text-brand-light" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.roles}
                  </p>
                  <p className="text-sm text-muted-foreground">Rôles</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-lg">
                  <Plug className="w-6 h-6 text-success-light" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.integrations}
                  </p>
                  <p className="text-sm text-muted-foreground">Intégrations actives</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.auditLogs}
                  </p>
                  <p className="text-sm text-muted-foreground">Logs d&apos;audit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {adminModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="bg-surface-primary rounded-xl p-6 border border-border hover:border-brand/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${module.color} rounded-lg`}>
                    <module.icon className="w-6 h-6 text-white" />
                  </div>
                  {module.stat !== null && (
                    <span className="text-2xl font-bold text-white">
                      {loading ? "..." : module.stat}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-light transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
                {module.statLabel && (
                  <p className="text-xs text-text-tertiary mt-2">{module.statLabel}</p>
                )}
              </Link>
            ))}
          </div>

          {/* Quick Actions & Security */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-white mb-4">Actions rapides</h3>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary/50 hover:bg-surface-secondary transition-colors"
                  >
                    <action.icon className="w-5 h-5 text-brand-light" />
                    <span className="text-foreground">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-white mb-4">Sécurité</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-success-light" />
                    <span className="text-foreground">Authentification</span>
                  </div>
                  <span className="px-2 py-1 text-xs bg-success/20 text-success-light rounded">
                    Activée
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-warning" />
                    <span className="text-foreground">2FA</span>
                  </div>
                  <span className="px-2 py-1 text-xs bg-amber-500/20 text-warning rounded">
                    Optionnel
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-success-light" />
                    <span className="text-foreground">Chiffrement données</span>
                  </div>
                  <span className="px-2 py-1 text-xs bg-success/20 text-success-light rounded">
                    AES-256
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-success-light" />
                    <span className="text-foreground">Journal d&apos;audit</span>
                  </div>
                  <span className="px-2 py-1 text-xs bg-success/20 text-success-light rounded">
                    Actif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
