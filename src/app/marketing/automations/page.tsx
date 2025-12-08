"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  Zap,
  Plus,
  Search,
  Play,
  Pause,
  Settings,
  Trash2,
  Users,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  isActive: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
  _count: {
    steps: number;
    logs: number;
  };
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/marketing/automations");
      const data = await res.json();
      setAutomations(data);
    } catch (error) {
      console.error("Error fetching automations:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/marketing/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        setAutomations(
          automations.map((a) =>
            a.id === id ? { ...a, isActive: !isActive } : a
          )
        );
      }
    } catch (error) {
      console.error("Error toggling automation:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette automatisation ?")) return;

    try {
      const res = await fetch(`/api/marketing/automations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAutomations(automations.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting automation:", error);
    }
  };

  const filteredAutomations = automations.filter((automation) =>
    automation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "NEW_DONOR":
        return <Users className="w-5 h-5" />;
      case "NEW_DONATION":
        return <CheckCircle className="w-5 h-5" />;
      case "DONATION_ANNIVERSARY":
        return <Clock className="w-5 h-5" />;
      case "INACTIVITY":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      NEW_DONOR: "Nouveau donateur",
      NEW_DONATION: "Nouveau don",
      DONATION_ANNIVERSARY: "Anniversaire de don",
      INACTIVITY: "Inactivité",
      BIRTHDAY: "Anniversaire",
      RECURRING_PAYMENT: "Paiement récurrent",
      CAMPAIGN_END: "Fin de campagne",
      CUSTOM: "Personnalisé",
    };
    return labels[type] || type;
  };

  const getTriggerColor = (type: string) => {
    const colors: Record<string, string> = {
      NEW_DONOR: "bg-green-500/20 text-green-400",
      NEW_DONATION: "bg-blue-500/20 text-blue-400",
      DONATION_ANNIVERSARY: "bg-purple-500/20 text-purple-400",
      INACTIVITY: "bg-orange-500/20 text-orange-400",
      BIRTHDAY: "bg-pink-500/20 text-pink-400",
      RECURRING_PAYMENT: "bg-cyan-500/20 text-cyan-400",
      CAMPAIGN_END: "bg-yellow-500/20 text-yellow-400",
      CUSTOM: "bg-gray-500/20 text-gray-400",
    };
    return colors[type] || colors.CUSTOM;
  };

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Automatisations", href: "/marketing/automations" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Automatisations</h1>
            <p className="text-gray-400 mt-1">
              Configurez des workflows automatiques pour engager vos donateurs
            </p>
          </div>
          <Link
            href="/marketing/automations/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle automatisation
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une automatisation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Automations List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAutomations.length > 0 ? (
          <div className="space-y-4">
            {filteredAutomations.map((automation) => (
              <div
                key={automation.id}
                className={`bg-slate-800/50 rounded-xl border p-6 transition-colors ${
                  automation.isActive
                    ? "border-green-500/30 hover:border-green-500/50"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getTriggerColor(automation.triggerType)}`}>
                      {getTriggerIcon(automation.triggerType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          {automation.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            automation.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {automation.isActive ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      {automation.description && (
                        <p className="text-gray-400 text-sm mt-1">
                          {automation.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded ${getTriggerColor(automation.triggerType)}`}>
                          {getTriggerLabel(automation.triggerType)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {automation._count.steps} étape(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {automation.triggerCount} déclenchement(s)
                        </span>
                        {automation.lastTriggeredAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Dernier: {new Date(automation.lastTriggeredAt).toLocaleDateString("fr-CA")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAutomation(automation.id, automation.isActive)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        automation.isActive
                          ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                    >
                      {automation.isActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Activer
                        </>
                      )}
                    </button>
                    <Link
                      href={`/marketing/automations/${automation.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Configurer"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(automation.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
            <Zap className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucune automatisation configurée
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Les automatisations vous permettent d&apos;envoyer des emails automatiquement
              en fonction d&apos;événements comme un nouveau don ou l&apos;anniversaire d&apos;un donateur.
            </p>
            <Link
              href="/marketing/automations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Créer une automatisation
            </Link>
          </div>
        )}

        {/* Suggested Automations */}
        {automations.length === 0 && !loading && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Automatisations suggérées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Email de bienvenue",
                  trigger: "NEW_DONOR",
                  description: "Accueillez chaque nouveau donateur avec un message personnalisé",
                },
                {
                  name: "Remerciement post-don",
                  trigger: "NEW_DONATION",
                  description: "Remerciez automatiquement après chaque don reçu",
                },
                {
                  name: "Anniversaire de don",
                  trigger: "DONATION_ANNIVERSARY",
                  description: "Célébrez la date anniversaire du premier don",
                },
                {
                  name: "Réactivation",
                  trigger: "INACTIVITY",
                  description: "Contactez les donateurs inactifs depuis 90 jours",
                },
              ].map((suggestion) => (
                <Link
                  key={suggestion.name}
                  href={`/marketing/automations/new?trigger=${suggestion.trigger}&name=${encodeURIComponent(suggestion.name)}`}
                  className="p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-pink-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTriggerColor(suggestion.trigger)}`}>
                      {getTriggerIcon(suggestion.trigger)}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{suggestion.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
