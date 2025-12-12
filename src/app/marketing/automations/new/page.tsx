"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Zap,
  ArrowLeft,
  Save,
  Users,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";

const TRIGGERS = [
  { value: "NEW_DONOR", label: "Nouveau donateur", icon: Users, description: "Déclenché quand un nouveau donateur est créé" },
  { value: "FIRST_DONATION", label: "Premier don", icon: CheckCircle, description: "Déclenché lors du premier don d'un donateur" },
  { value: "DONATION_RECEIVED", label: "Don reçu", icon: CheckCircle, description: "Déclenché à chaque don reçu" },
  { value: "BIRTHDAY", label: "Anniversaire", icon: Calendar, description: "Déclenché le jour de l'anniversaire du donateur" },
  { value: "DONATION_ANNIVERSARY", label: "Anniversaire de don", icon: Calendar, description: "Déclenché à l'anniversaire du premier don" },
  { value: "INACTIVE_30_DAYS", label: "Inactif 30 jours", icon: AlertCircle, description: "Déclenché après 30 jours sans activité" },
  { value: "INACTIVE_90_DAYS", label: "Inactif 90 jours", icon: AlertCircle, description: "Déclenché après 90 jours sans activité" },
  { value: "RECURRING_STARTED", label: "Don récurrent démarré", icon: Clock, description: "Déclenché au début d'un don récurrent" },
  { value: "RECURRING_CANCELLED", label: "Don récurrent annulé", icon: AlertCircle, description: "Déclenché à l'annulation d'un don récurrent" },
];

const ACTIONS = [
  { value: "SEND_EMAIL", label: "Envoyer un email", description: "Envoyer un email personnalisé" },
  { value: "ADD_TAG", label: "Ajouter un tag", description: "Ajouter un tag au donateur" },
  { value: "REMOVE_TAG", label: "Retirer un tag", description: "Retirer un tag du donateur" },
  { value: "UPDATE_SEGMENT", label: "Mettre à jour le segment", description: "Changer le segment du donateur" },
  { value: "NOTIFY_TEAM", label: "Notifier l'équipe", description: "Envoyer une notification à l'équipe" },
];

const DELAY_TYPES = [
  { value: "IMMEDIATE", label: "Immédiat" },
  { value: "MINUTES", label: "Après X minutes" },
  { value: "HOURS", label: "Après X heures" },
  { value: "DAYS", label: "Après X jours" },
];

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
}

function NewAutomationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [formData, setFormData] = useState({
    name: searchParams.get("name") || "",
    description: "",
    triggerType: searchParams.get("trigger") || "",
    triggerConfig: {},
    actionType: "SEND_EMAIL",
    actionConfig: {
      templateId: "",
      subject: "",
      tagName: "",
      segmentName: "",
      notificationMessage: "",
    },
    delayType: "IMMEDIATE",
    delayMinutes: 0,
    maxExecutions: null as number | null,
    cooldownHours: null as number | null,
    isActive: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/marketing/templates?isActive=true");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculer les minutes de délai
      let delayMinutes = 0;
      if (formData.delayType === "MINUTES") {
        delayMinutes = formData.delayMinutes;
      } else if (formData.delayType === "HOURS") {
        delayMinutes = formData.delayMinutes * 60;
      } else if (formData.delayType === "DAYS") {
        delayMinutes = formData.delayMinutes * 60 * 24;
      }

      const res = await fetch("/api/marketing/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          triggerType: formData.triggerType,
          triggerConfig: formData.triggerConfig,
          actionType: formData.actionType,
          actionConfig: formData.actionConfig,
          delayType: formData.delayType,
          delayMinutes,
          maxExecutions: formData.maxExecutions,
          cooldownHours: formData.cooldownHours,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        const automation = await res.json();
        router.push(`/marketing/automations/${automation.id}`);
      } else {
        alert("Erreur lors de la création de l'automatisation");
      }
    } catch (error) {
      console.error("Error creating automation:", error);
      alert("Erreur lors de la création de l'automatisation");
    } finally {
      setLoading(false);
    }
  };

  const selectedTrigger = TRIGGERS.find((t) => t.value === formData.triggerType);

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Automatisations", href: "/marketing/automations" },
    { name: "Nouvelle automatisation", href: "/marketing/automations/new" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-muted-foreground hover:text-white hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Nouvelle automatisation</h1>
            <p className="text-muted-foreground text-sm">Configurez un workflow automatique</p>
          </div>
        </div>

        {/* Step 1: Basic Info */}
        <div className="bg-surface-secondary/50 rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Informations générales
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom de l&apos;automatisation *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Email de bienvenue"
              className="w-full px-4 py-2 bg-surface-primary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez le but de cette automatisation..."
              rows={2}
              className="w-full px-4 py-2 bg-surface-primary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Step 2: Trigger */}
        <div className="bg-surface-secondary/50 rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Déclencheur</h2>
          <p className="text-sm text-muted-foreground">Quand cette automatisation doit-elle se déclencher ?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRIGGERS.map((trigger) => (
              <button
                key={trigger.value}
                type="button"
                onClick={() => setFormData({ ...formData, triggerType: trigger.value })}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  formData.triggerType === trigger.value
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <trigger.icon className={`w-5 h-5 ${formData.triggerType === trigger.value ? "text-accent" : "text-muted-foreground"}`} />
                  <span className="font-medium text-white">{trigger.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{trigger.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Action */}
        <div className="bg-surface-secondary/50 rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Action</h2>
          <p className="text-sm text-muted-foreground">Que doit faire cette automatisation ?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ACTIONS.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => setFormData({ ...formData, actionType: action.value })}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  formData.actionType === action.value
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-border"
                }`}
              >
                <div className="font-medium text-white">{action.label}</div>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Action Config */}
          {formData.actionType === "SEND_EMAIL" && (
            <div className="mt-4 p-4 bg-surface-primary rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Template email
                </label>
                <select
                  value={formData.actionConfig.templateId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, templateId: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white focus:outline-none focus:border-accent"
                >
                  <option value="">Sélectionner un template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(formData.actionType === "ADD_TAG" || formData.actionType === "REMOVE_TAG") && (
            <div className="mt-4 p-4 bg-surface-primary rounded-lg">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom du tag
              </label>
              <input
                type="text"
                value={formData.actionConfig.tagName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actionConfig: { ...formData.actionConfig, tagName: e.target.value },
                  })
                }
                placeholder="Ex: nouveau-donateur"
                className="w-full px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
          )}

          {formData.actionType === "UPDATE_SEGMENT" && (
            <div className="mt-4 p-4 bg-surface-primary rounded-lg">
              <label className="block text-sm font-medium text-foreground mb-2">
                Nouveau segment
              </label>
              <input
                type="text"
                value={formData.actionConfig.segmentName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actionConfig: { ...formData.actionConfig, segmentName: e.target.value },
                  })
                }
                placeholder="Ex: Donateurs actifs"
                className="w-full px-4 py-2 bg-surface-secondary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        {/* Step 4: Timing */}
        <div className="bg-surface-secondary/50 rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Délai
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DELAY_TYPES.map((delay) => (
              <button
                key={delay.value}
                type="button"
                onClick={() => setFormData({ ...formData, delayType: delay.value })}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  formData.delayType === delay.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-border"
                }`}
              >
                {delay.label}
              </button>
            ))}
          </div>

          {formData.delayType !== "IMMEDIATE" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Durée du délai
              </label>
              <input
                type="number"
                min="1"
                value={formData.delayMinutes}
                onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 bg-surface-primary border border-border rounded-lg text-white focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        {/* Step 5: Limits */}
        <div className="bg-surface-secondary/50 rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-white">Limites (optionnel)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Exécutions max par donateur
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxExecutions || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxExecutions: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Illimité"
                className="w-full px-4 py-2 bg-surface-primary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Délai entre exécutions (heures)
              </label>
              <input
                type="number"
                min="1"
                value={formData.cooldownHours || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cooldownHours: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Aucun"
                className="w-full px-4 py-2 bg-surface-primary border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-border bg-surface-primary text-accent focus:ring-pink-500"
            />
            <label htmlFor="isActive" className="text-sm text-foreground">
              Activer immédiatement
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.triggerType}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Création..." : "Créer l'automatisation"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}

export default function NewAutomationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>}>
      <NewAutomationContent />
    </Suspense>
  );
}
