"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { Plug, CreditCard, Mail, Users, BarChart, Share2, Check, X, Settings, ExternalLink } from "lucide-react";

interface Integration {
  id: string | null;
  provider: string;
  name: string;
  description: string;
  category: string;
  logoUrl: string;
  docsUrl: string;
  isEnabled: boolean;
  isConfigured: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [groupedIntegrations, setGroupedIntegrations] = useState<Record<string, Integration[]>>({});
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configuring, setConfiguring] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/integrations");
      const data = await res.json();

      setIntegrations(data.integrations || []);
      setGroupedIntegrations(data.grouped || {});
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (integration: Integration) => {
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: integration.provider,
          isEnabled: !integration.isEnabled,
        }),
      });

      if (res.ok) {
        fetchIntegrations();
      }
    } catch (error) {
      console.error("Error toggling integration:", error);
    }
  };

  const handleConfigure = async (integration: Integration) => {
    setSelectedIntegration(integration);
    // In a real app, this would open a configuration modal
    alert(`Configuration de ${integration.name} - Cette fonctionnalité sera disponible prochainement.`);
  };

  const categoryIcons: Record<string, typeof Plug> = {
    PAYMENT: CreditCard,
    EMAIL: Mail,
    CRM: Users,
    ACCOUNTING: BarChart,
    ANALYTICS: BarChart,
    SOCIAL: Share2,
    OTHER: Plug,
  };

  const categoryLabels: Record<string, string> = {
    PAYMENT: "Paiements",
    EMAIL: "Email",
    CRM: "CRM",
    ACCOUNTING: "Comptabilité",
    ANALYTICS: "Analytics",
    SOCIAL: "Réseaux sociaux",
    OTHER: "Autres",
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Link href="/admin" className="hover:text-white">Administration</Link>
              <span>/</span>
              <span className="text-white">Intégrations</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Intégrations</h1>
            <p className="text-muted-foreground mt-1">
              Connectez des services externes pour étendre les fonctionnalités
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-lg">
                  <Check className="w-6 h-6 text-success-light" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {integrations.filter((i) => i.isEnabled).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Intégrations actives</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Settings className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {integrations.filter((i) => i.isConfigured).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Configurées</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-primary rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/20 rounded-lg">
                  <Plug className="w-6 h-6 text-brand-light" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {integrations.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations by Category */}
          {loading ? (
            <div className="bg-surface-primary rounded-xl p-8 border border-border text-center text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => {
                const Icon = categoryIcons[category] || Plug;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-5 h-5 text-brand-light" />
                      <h2 className="text-lg font-semibold text-white">
                        {categoryLabels[category] || category}
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryIntegrations.map((integration) => (
                        <div
                          key={integration.provider}
                          className={`bg-surface-primary rounded-xl p-6 border transition-colors ${
                            integration.isEnabled
                              ? "border-green-500/50"
                              : "border-border hover:border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-surface-secondary flex items-center justify-center overflow-hidden">
                                {integration.logoUrl ? (
                                  <img
                                    src={integration.logoUrl}
                                    alt={integration.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Plug className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{integration.name}</h3>
                                <p className="text-xs text-text-tertiary">
                                  {integration.isConfigured ? "Configuré" : "Non configuré"}
                                </p>
                              </div>
                            </div>
                            
                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={integration.isEnabled}
                                onChange={() => handleToggle(integration)}
                                disabled={!integration.isConfigured}
                                className="sr-only peer"
                              />
                              <div className={`w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 ${!integration.isConfigured ? "opacity-50 cursor-not-allowed" : ""}`}></div>
                            </label>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-4">
                            {integration.description}
                          </p>
                          
                          {integration.lastSyncAt && (
                            <p className="text-xs text-text-tertiary mb-4">
                              Dernière sync: {new Date(integration.lastSyncAt).toLocaleString("fr-FR")}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfigure(integration)}
                              className="flex-1 px-3 py-2 bg-surface-secondary hover:bg-surface-tertiary text-white text-sm rounded-lg transition-colors"
                            >
                              <Settings className="w-4 h-4 inline mr-1" />
                              Configurer
                            </button>
                            {integration.docsUrl && (
                              <a
                                href={integration.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-muted-foreground hover:text-white hover:bg-surface-secondary rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
