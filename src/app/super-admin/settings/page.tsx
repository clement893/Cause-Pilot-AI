"use client";

import { useState } from "react";
import SuperAdminWrapper from "@/components/super-admin/SuperAdminWrapper";
import {
  Settings,
  Shield,
  Bell,
  Mail,
  Globe,
  Database,
  Save,
  RefreshCw,
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: "general", label: "Général", icon: Settings },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "email", label: "Email", icon: Mail },
    { id: "integrations", label: "Intégrations", icon: Globe },
    { id: "database", label: "Base de données", icon: Database },
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <SuperAdminWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Paramètres</h1>
            <p className="text-slate-400 mt-1">
              Configuration globale de la plateforme
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Sauvegarder
          </button>
        </div>

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-purple-500/20 text-purple-300"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Paramètres généraux
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nom de la plateforme
                      </label>
                      <input
                        type="text"
                        defaultValue="Cause Pilot AI"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        URL de la plateforme
                      </label>
                      <input
                        type="url"
                        defaultValue="https://web-production-4c73d.up.railway.app"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Langue par défaut
                      </label>
                      <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fuseau horaire
                      </label>
                      <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="America/Toronto">America/Toronto (EST)</option>
                        <option value="America/Montreal">America/Montreal (EST)</option>
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Sécurité
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">
                          Authentification Google obligatoire
                        </p>
                        <p className="text-sm text-slate-400">
                          Seuls les utilisateurs @nukleo.com peuvent accéder
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-purple-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">
                          Double authentification (2FA)
                        </p>
                        <p className="text-sm text-slate-400">
                          Exiger 2FA pour tous les super-admins
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-slate-600 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">
                          Logs d&apos;audit
                        </p>
                        <p className="text-sm text-slate-400">
                          Enregistrer toutes les actions administratives
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-purple-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Durée de session (heures)
                      </label>
                      <input
                        type="number"
                        defaultValue={24}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Notifications
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">
                          Nouvelle organisation
                        </p>
                        <p className="text-sm text-slate-400">
                          Notifier quand une nouvelle organisation est créée
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-purple-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">
                          Nouvel utilisateur admin
                        </p>
                        <p className="text-sm text-slate-400">
                          Notifier quand un nouvel admin se connecte
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-purple-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                      <div>
                        <p className="text-white font-medium">
                          Alertes de sécurité
                        </p>
                        <p className="text-sm text-slate-400">
                          Notifier en cas de tentative de connexion suspecte
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-purple-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email de notification
                      </label>
                      <input
                        type="email"
                        defaultValue="admin@nukleo.com"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "email" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Configuration Email
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fournisseur SMTP
                      </label>
                      <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="sendgrid">SendGrid</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="ses">Amazon SES</option>
                        <option value="custom">Custom SMTP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email expéditeur
                      </label>
                      <input
                        type="email"
                        defaultValue="noreply@causepilot.ai"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nom expéditeur
                      </label>
                      <input
                        type="text"
                        defaultValue="Cause Pilot AI"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Intégrations
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-xl">G</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">Google OAuth</p>
                            <p className="text-sm text-green-400">Connecté</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors">
                          Configurer
                        </button>
                      </div>
                      <p className="text-sm text-slate-400">
                        Domaine autorisé: nukleo.com
                      </p>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-xl text-white">S</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">Stripe</p>
                            <p className="text-sm text-slate-400">Non connecté</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                          Connecter
                        </button>
                      </div>
                      <p className="text-sm text-slate-400">
                        Gestion des paiements et abonnements
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "database" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">
                    Base de données
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <Database className="w-5 h-5" />
                        <span className="font-medium">Connexion active</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        PostgreSQL sur Railway
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-slate-400">Organisations</p>
                        <p className="text-2xl font-bold text-white">--</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-slate-400">Utilisateurs Admin</p>
                        <p className="text-2xl font-bold text-white">--</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-slate-400">Donateurs</p>
                        <p className="text-2xl font-bold text-white">--</p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-xl">
                        <p className="text-sm text-slate-400">Dons</p>
                        <p className="text-2xl font-bold text-white">--</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
                        Exporter les données
                      </button>
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminWrapper>
  );
}
