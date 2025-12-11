"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  Mail,
  Clock,
  Tag,
  Bell,
  ChevronDown,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actions: ActionConfig[];
}

interface ActionConfig {
  order: number;
  actionType: string;
  config: Record<string, unknown>;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const TRIGGER_OPTIONS = [
  { value: "NEW_DONOR", label: "Nouveau donateur", description: "Après le premier don", icon: "👋" },
  { value: "POST_DONATION", label: "Après un don", description: "Après chaque don", icon: "💝" },
  { value: "DONATION_ANNIVERSARY", label: "Anniversaire de don", description: "1 an après un don", icon: "🎂" },
  { value: "DONOR_BIRTHDAY", label: "Anniversaire donateur", description: "Le jour de l'anniversaire", icon: "🎈" },
  { value: "INACTIVE_DONOR", label: "Donateur inactif", description: "Après X jours sans don", icon: "🔄" },
  { value: "CAMPAIGN_GOAL_REACHED", label: "Objectif atteint", description: "Campagne à 100%", icon: "🎯" },
  { value: "RECURRING_CANCELLED", label: "Récurrent annulé", description: "Don mensuel annulé", icon: "⚠️" },
  { value: "UPGRADE_OPPORTUNITY", label: "Opportunité upgrade", description: "Après X dons ponctuels", icon: "⬆️" },
];

const ACTION_OPTIONS = [
  { value: "SEND_EMAIL", label: "Envoyer un email", icon: Mail, color: "bg-blue-500/20 text-blue-400" },
  { value: "WAIT", label: "Attendre", icon: Clock, color: "bg-yellow-500/20 text-yellow-400" },
  { value: "ADD_TAG", label: "Ajouter un tag", icon: Tag, color: "bg-green-500/20 text-green-400" },
  { value: "REMOVE_TAG", label: "Retirer un tag", icon: Tag, color: "bg-red-500/20 text-red-400" },
  { value: "NOTIFY_TEAM", label: "Notifier l'équipe", icon: Bell, color: "bg-purple-500/20 text-purple-400" },
];

export default function NewAutomationPage() {
  const router = useRouter();
  const [step, setStep] = useState<"template" | "configure">("template");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Configuration de l'automatisation
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actions, setActions] = useState<ActionConfig[]>([]);
  const [expandedAction, setExpandedAction] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/automations/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: Template) => {
    setName(template.name);
    setDescription(template.description);
    setTriggerType(template.triggerType);
    setTriggerConfig(template.triggerConfig);
    setActions(template.actions);
    setStep("configure");
  };

  const startFromScratch = () => {
    setName("");
    setDescription("");
    setTriggerType("");
    setTriggerConfig({});
    setActions([]);
    setStep("configure");
  };

  const addAction = (actionType: string) => {
    const newAction: ActionConfig = {
      order: actions.length + 1,
      actionType,
      config: getDefaultConfig(actionType),
    };
    setActions([...actions, newAction]);
    setExpandedAction(actions.length);
  };

  const getDefaultConfig = (actionType: string): Record<string, unknown> => {
    switch (actionType) {
      case "SEND_EMAIL":
        return { subject: "", body: "" };
      case "WAIT":
        return { days: 1, hours: 0 };
      case "ADD_TAG":
      case "REMOVE_TAG":
        return { tag: "" };
      case "NOTIFY_TEAM":
        return { message: "", notifyOwner: true };
      default:
        return {};
    }
  };

  const updateAction = (index: number, config: Record<string, unknown>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], config };
    setActions(updated);
  };

  const removeAction = (index: number) => {
    const updated = actions.filter((_, i) => i !== index);
    // Recalculer les ordres
    updated.forEach((a, i) => (a.order = i + 1));
    setActions(updated);
  };

  const handleSave = async (status: "DRAFT" | "ACTIVE") => {
    if (!name || !triggerType || actions.length === 0) {
      alert("Veuillez remplir tous les champs requis");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          triggerType,
          triggerConfig,
          actions,
          status,
        }),
      });

      if (response.ok) {
        router.push("/automations");
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Sidebar />
        <main className="ml-64 p-8 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/automations"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {step === "template" ? "Nouvelle automatisation" : name || "Configuration"}
            </h1>
            <p className="text-gray-400">
              {step === "template"
                ? "Choisissez un template ou créez de zéro"
                : "Configurez votre workflow"}
            </p>
          </div>
        </div>

        <div className="max-w-5xl">
          {/* Étape 1: Choix du template */}
          {step === "template" && (
            <div>
              {/* Créer de zéro */}
              <button
                onClick={startFromScratch}
                className="w-full mb-8 p-6 bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 hover:border-purple-500 hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Plus className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Créer de zéro</p>
                    <p className="text-sm text-gray-400">
                      Configurez chaque étape manuellement
                    </p>
                  </div>
                </div>
              </button>

              {/* Filtres par catégorie */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-gray-300 hover:bg-slate-700 border border-slate-700"
                  }`}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-purple-600 text-white"
                        : "bg-slate-800 text-gray-300 hover:bg-slate-700 border border-slate-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => selectTemplate(template)}
                    className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500 hover:bg-slate-800 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{template.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white group-hover:text-purple-400">
                            {template.name}
                          </h3>
                          <Sparkles className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-gray-400">
                            {template.actions.length} action{template.actions.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Configuration */}
          {step === "configure" && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Informations générales
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nom de l&apos;automatisation *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Bienvenue nouveau donateur"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Décrivez ce que fait cette automatisation..."
                    />
                  </div>
                </div>
              </div>

              {/* Déclencheur */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Déclencheur
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Quand cette automatisation doit-elle se déclencher ?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TRIGGER_OPTIONS.map((trigger) => (
                    <button
                      key={trigger.value}
                      onClick={() => setTriggerType(trigger.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        triggerType === trigger.value
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-slate-700 hover:border-slate-600 bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{trigger.icon}</span>
                        <div>
                          <p className="font-medium text-white">{trigger.label}</p>
                          <p className="text-xs text-gray-400">{trigger.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Configuration spécifique au trigger */}
                {triggerType === "INACTIVE_DONOR" && (
                  <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de jours d&apos;inactivité
                    </label>
                    <input
                      type="number"
                      value={(triggerConfig.inactiveDays as number) || 180}
                      onChange={(e) =>
                        setTriggerConfig({ ...triggerConfig, inactiveDays: parseInt(e.target.value) })
                      }
                      className="w-32 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      min={30}
                    />
                  </div>
                )}

                {triggerType === "UPGRADE_OPPORTUNITY" && (
                  <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre minimum de dons ponctuels
                    </label>
                    <input
                      type="number"
                      value={(triggerConfig.minDonations as number) || 3}
                      onChange={(e) =>
                        setTriggerConfig({ ...triggerConfig, minDonations: parseInt(e.target.value) })
                      }
                      className="w-32 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      min={1}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Actions
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Que doit faire cette automatisation ?
                </p>

                {/* Liste des actions */}
                <div className="space-y-3 mb-6">
                  {actions.map((action, index) => {
                    const actionOption = ACTION_OPTIONS.find((a) => a.value === action.actionType);
                    const Icon = actionOption?.icon || Mail;
                    const isExpanded = expandedAction === index;

                    return (
                      <div
                        key={index}
                        className="border border-slate-700 rounded-lg overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-3 p-4 bg-slate-800 cursor-pointer"
                          onClick={() => setExpandedAction(isExpanded ? null : index)}
                        >
                          <GripVertical className="w-5 h-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-400 w-6">
                            {index + 1}.
                          </span>
                          <div className={`p-2 rounded-lg ${actionOption?.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-white flex-1">
                            {actionOption?.label}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAction(index);
                            }}
                            className="p-1 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-700 bg-slate-850">
                            {action.actionType === "SEND_EMAIL" && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Sujet de l&apos;email
                                  </label>
                                  <input
                                    type="text"
                                    value={(action.config.subject as string) || ""}
                                    onChange={(e) =>
                                      updateAction(index, { ...action.config, subject: e.target.value })
                                    }
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder="Ex: Bienvenue {{firstName}} !"
                                  />
                                  <p className="mt-1 text-xs text-gray-500">
                                    Variables: {"{{firstName}}"}, {"{{lastName}}"}, {"{{fullName}}"}, {"{{email}}"}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Contenu de l&apos;email (HTML)
                                  </label>
                                  <textarea
                                    value={(action.config.body as string) || ""}
                                    onChange={(e) =>
                                      updateAction(index, { ...action.config, body: e.target.value })
                                    }
                                    rows={8}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono text-sm text-white"
                                    placeholder="<h1>Bonjour {{firstName}} !</h1>..."
                                  />
                                </div>
                              </div>
                            )}

                            {action.actionType === "WAIT" && (
                              <div className="flex items-center gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Jours
                                  </label>
                                  <input
                                    type="number"
                                    value={(action.config.days as number) || 0}
                                    onChange={(e) =>
                                      updateAction(index, { ...action.config, days: parseInt(e.target.value) })
                                    }
                                    className="w-24 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    min={0}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Heures
                                  </label>
                                  <input
                                    type="number"
                                    value={(action.config.hours as number) || 0}
                                    onChange={(e) =>
                                      updateAction(index, { ...action.config, hours: parseInt(e.target.value) })
                                    }
                                    className="w-24 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    min={0}
                                    max={23}
                                  />
                                </div>
                              </div>
                            )}

                            {(action.actionType === "ADD_TAG" || action.actionType === "REMOVE_TAG") && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Tag
                                </label>
                                <input
                                  type="text"
                                  value={(action.config.tag as string) || ""}
                                  onChange={(e) =>
                                    updateAction(index, { ...action.config, tag: e.target.value })
                                  }
                                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                  placeholder="Ex: nouveau_donateur"
                                />
                              </div>
                            )}

                            {action.actionType === "NOTIFY_TEAM" && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Message
                                  </label>
                                  <input
                                    type="text"
                                    value={(action.config.message as string) || ""}
                                    onChange={(e) =>
                                      updateAction(index, { ...action.config, message: e.target.value })
                                    }
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    placeholder="Ex: Nouveau don de {{fullName}}"
                                  />
                                </div>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={(action.config.notifyOwner as boolean) || false}
                                    onChange={(e) =>
                                      updateAction(index, { ...action.config, notifyOwner: e.target.checked })
                                    }
                                    className="rounded bg-slate-700 border-slate-600"
                                  />
                                  <span className="text-sm text-gray-300">
                                    Notifier le propriétaire
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ajouter une action */}
                <div className="flex flex-wrap gap-2">
                  {ACTION_OPTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.value}
                        onClick={() => addAction(action.value)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <div className={`p-1 rounded ${action.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boutons de sauvegarde */}
              <div className="flex items-center justify-between bg-slate-900 rounded-xl border border-slate-800 p-6">
                <button
                  onClick={() => setStep("template")}
                  className="px-4 py-2 text-gray-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Retour aux templates
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave("DRAFT")}
                    disabled={saving}
                    className="px-6 py-2 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    Enregistrer comme brouillon
                  </button>
                  <button
                    onClick={() => handleSave("ACTIVE")}
                    disabled={saving || !name || !triggerType || actions.length === 0}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Enregistrement..." : "Activer l'automatisation"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
