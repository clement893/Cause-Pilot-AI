"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DonationForm, 
  FormCreateInput, 
  FormType, 
  FormStatus,
  RecurringFrequency,
  FORM_TYPE_LABELS 
} from "@/types/form";
import { Sparkles, Loader2, Lightbulb, Wand2 } from "lucide-react";

interface FormBuilderProps {
  initialData?: DonationForm;
  mode: "create" | "edit";
}

interface AISuggestions {
  name?: string;
  description?: string;
  suggestedAmounts?: number[];
  thankYouMessage?: string;
  recommendedFields?: string[];
  tips?: string[];
  reasoning?: string;
}

export default function FormBuilder({ initialData, mode }: FormBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [formData, setFormData] = useState<FormCreateInput>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    formType: initialData?.formType || "ONE_TIME",
    status: initialData?.status || "DRAFT",
    suggestedAmounts: initialData?.suggestedAmounts || [25, 50, 100, 250, 500],
    minimumAmount: initialData?.minimumAmount || 5,
    maximumAmount: initialData?.maximumAmount || undefined,
    allowCustomAmount: initialData?.allowCustomAmount ?? true,
    defaultAmount: initialData?.defaultAmount || undefined,
    recurringOptions: initialData?.recurringOptions || ["MONTHLY"],
    defaultRecurring: initialData?.defaultRecurring || undefined,
    primaryColor: initialData?.primaryColor || "#6366f1",
    secondaryColor: initialData?.secondaryColor || "#8b5cf6",
    thankYouMessage: initialData?.thankYouMessage || "Merci pour votre généreux don! Votre contribution fait une réelle différence.",
    collectPhone: initialData?.collectPhone ?? false,
    collectAddress: initialData?.collectAddress ?? false,
    collectEmployer: initialData?.collectEmployer ?? false,
    collectComment: initialData?.collectComment ?? true,
    collectDedication: initialData?.collectDedication ?? false,
    allowAnonymous: initialData?.allowAnonymous ?? true,
    goalAmount: initialData?.goalAmount || undefined,
  });

  // Fonction pour obtenir des suggestions IA
  const getAISuggestions = async (type: string) => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/forms/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          formId: initialData?.id,
          currentData: {
            name: formData.name,
            description: formData.description,
            suggestedAmounts: formData.suggestedAmounts,
            thankYouMessage: formData.thankYouMessage,
            formType: formData.formType,
          }
        })
      });

      const data = await response.json();
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
        setShowAiPanel(true);
      }
    } catch (err) {
      console.error("AI assist error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Appliquer une suggestion IA
  const applySuggestion = (field: keyof FormCreateInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Appliquer toutes les suggestions
  const applyAllSuggestions = () => {
    if (!aiSuggestions) return;
    
    const updates: Partial<FormCreateInput> = {};
    if (aiSuggestions.name) updates.name = aiSuggestions.name;
    if (aiSuggestions.description) updates.description = aiSuggestions.description;
    if (aiSuggestions.suggestedAmounts) updates.suggestedAmounts = aiSuggestions.suggestedAmounts;
    if (aiSuggestions.thankYouMessage) updates.thankYouMessage = aiSuggestions.thankYouMessage;
    
    // Appliquer les champs recommandés
    if (aiSuggestions.recommendedFields) {
      updates.collectPhone = aiSuggestions.recommendedFields.includes("phone");
      updates.collectAddress = aiSuggestions.recommendedFields.includes("address");
      updates.collectEmployer = aiSuggestions.recommendedFields.includes("employer");
      updates.collectComment = aiSuggestions.recommendedFields.includes("comment");
      updates.collectDedication = aiSuggestions.recommendedFields.includes("dedication");
    }

    setFormData(prev => ({ ...prev, ...updates }));
    setShowAiPanel(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = mode === "create" 
        ? "/api/forms" 
        : `/api/forms/${initialData?.id}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      const result = await response.json();
      router.push(`/forms/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof FormCreateInput>(
    field: K, 
    value: FormCreateInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex gap-6">
      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-8">
        {error && (
          <div className="bg-error/20/50 border border-error text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Bandeau CausePilot */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">CausePilot - Assistant IA</h3>
                <p className="text-sm text-foreground">Laissez l&apos;IA vous aider à créer un formulaire optimisé</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => getAISuggestions("create_suggestions")}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Générer des suggestions
              </button>
              <button
                type="button"
                onClick={() => getAISuggestions("optimize_amounts")}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Lightbulb className="w-4 h-4" />
                Optimiser montants
              </button>
            </div>
          </div>
        </div>

        {/* Section: Informations générales */}
        <div className="bg-surface-secondary rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Informations générales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Nom du formulaire *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Don de fin d'année 2024"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Décrivez l'objectif de ce formulaire..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Type de formulaire
              </label>
              <select
                value={formData.formType}
                onChange={(e) => updateField("formType", e.target.value as FormType)}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField("status", e.target.value as FormStatus)}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="SCHEDULED">Planifié</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Configuration des montants */}
        <div className="bg-surface-secondary rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Configuration des montants
            </h2>
            <button
              type="button"
              onClick={() => getAISuggestions("optimize_amounts")}
              disabled={aiLoading}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Optimiser avec l&apos;IA
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Montants suggérés
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.suggestedAmounts?.map((amount, index) => (
                  <div key={index} className="flex items-center bg-indigo-900/50 border border-indigo-700 rounded-lg px-3 py-1">
                    <span className="text-indigo-300 font-medium">{amount} $</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newAmounts = formData.suggestedAmounts?.filter((_, i) => i !== index);
                        updateField("suggestedAmounts", newAmounts);
                      }}
                      className="ml-2 text-indigo-400 hover:text-indigo-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="number"
                  placeholder="Ajouter..."
                  className="w-24 px-3 py-1 bg-surface-tertiary border border-border rounded-lg text-sm text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = parseInt((e.target as HTMLInputElement).value);
                      if (value > 0) {
                        updateField("suggestedAmounts", [...(formData.suggestedAmounts || []), value].sort((a, b) => a - b));
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-text-tertiary">Appuyez sur Entrée pour ajouter un montant</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Montant minimum
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.minimumAmount}
                  onChange={(e) => updateField("minimumAmount", parseFloat(e.target.value))}
                  className="w-full px-4 py-2 pr-8 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Montant maximum (optionnel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.maximumAmount || ""}
                  onChange={(e) => updateField("maximumAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-2 pr-8 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Aucune limite"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Objectif de collecte (optionnel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.goalAmount || ""}
                  onChange={(e) => updateField("goalAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-2 pr-8 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 50000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowCustomAmount"
                checked={formData.allowCustomAmount}
                onChange={(e) => updateField("allowCustomAmount", e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded bg-surface-tertiary"
              />
              <label htmlFor="allowCustomAmount" className="ml-2 text-sm text-foreground">
                Permettre un montant personnalisé
              </label>
            </div>
          </div>

          {/* Options récurrentes si type récurrent */}
          {formData.formType === "RECURRING" && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-white mb-3">Options de récurrence</h3>
              <div className="flex flex-wrap gap-3">
                {(["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as RecurringFrequency[]).map((freq) => (
                  <label key={freq} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recurringOptions?.includes(freq)}
                      onChange={(e) => {
                        const current = formData.recurringOptions || [];
                        const updated = e.target.checked
                          ? [...current, freq]
                          : current.filter(f => f !== freq);
                        updateField("recurringOptions", updated);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded bg-surface-tertiary"
                    />
                    <span className="ml-2 text-sm text-foreground">
                      {freq === "WEEKLY" && "Hebdomadaire"}
                      {freq === "BIWEEKLY" && "Bi-mensuel"}
                      {freq === "MONTHLY" && "Mensuel"}
                      {freq === "QUARTERLY" && "Trimestriel"}
                      {freq === "YEARLY" && "Annuel"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section: Champs à collecter */}
        <div className="bg-surface-secondary rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Informations à collecter
            </h2>
            <button
              type="button"
              onClick={() => getAISuggestions("field_suggestions")}
              disabled={aiLoading}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Suggestions IA
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { field: "collectPhone" as const, label: "Numéro de téléphone" },
              { field: "collectAddress" as const, label: "Adresse postale" },
              { field: "collectEmployer" as const, label: "Employeur (pour matching gifts)" },
              { field: "collectComment" as const, label: "Commentaire / Message" },
              { field: "collectDedication" as const, label: "Dédicace (in memoriam, en l'honneur de)" },
              { field: "allowAnonymous" as const, label: "Permettre les dons anonymes" },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData[field]}
                  onChange={(e) => updateField(field, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-border rounded bg-surface-tertiary"
                />
                <span className="ml-2 text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section: Personnalisation */}
        <div className="bg-surface-secondary rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Personnalisation
            </h2>
            <button
              type="button"
              onClick={() => getAISuggestions("improve_text")}
              disabled={aiLoading}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Améliorer les textes
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Couleur principale
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-10 w-20 rounded border border-border cursor-pointer bg-surface-tertiary"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="flex-1 px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Couleur secondaire
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => updateField("secondaryColor", e.target.value)}
                  className="h-10 w-20 rounded border border-border cursor-pointer bg-surface-tertiary"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => updateField("secondaryColor", e.target.value)}
                  className="flex-1 px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Message de remerciement
              </label>
              <textarea
                value={formData.thankYouMessage}
                onChange={(e) => updateField("thankYouMessage", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Merci pour votre généreux don!"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-foreground bg-surface-tertiary rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : mode === "create" ? "Créer le formulaire" : "Enregistrer"}
          </button>
        </div>
      </form>

      {/* Panneau des suggestions IA */}
      {showAiPanel && aiSuggestions && (
        <div className="w-96 bg-surface-secondary border border-border rounded-xl p-6 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-medium">Suggestions CausePilot</h3>
            </div>
            <button
              onClick={() => setShowAiPanel(false)}
              className="text-muted-foreground hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {aiSuggestions.name && (
              <div className="bg-surface-tertiary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Nom suggéré</span>
                  <button
                    onClick={() => applySuggestion("name", aiSuggestions.name)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Appliquer
                  </button>
                </div>
                <p className="text-sm text-white">{aiSuggestions.name}</p>
              </div>
            )}

            {aiSuggestions.description && (
              <div className="bg-surface-tertiary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Description suggérée</span>
                  <button
                    onClick={() => applySuggestion("description", aiSuggestions.description)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Appliquer
                  </button>
                </div>
                <p className="text-sm text-white">{aiSuggestions.description}</p>
              </div>
            )}

            {aiSuggestions.suggestedAmounts && (
              <div className="bg-surface-tertiary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Montants optimisés</span>
                  <button
                    onClick={() => applySuggestion("suggestedAmounts", aiSuggestions.suggestedAmounts)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Appliquer
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.suggestedAmounts.map((amount, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-sm text-indigo-300">
                      {amount} $
                    </span>
                  ))}
                </div>
                {aiSuggestions.reasoning && (
                  <p className="text-xs text-muted-foreground mt-2">{aiSuggestions.reasoning}</p>
                )}
              </div>
            )}

            {aiSuggestions.thankYouMessage && (
              <div className="bg-surface-tertiary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Message de remerciement</span>
                  <button
                    onClick={() => applySuggestion("thankYouMessage", aiSuggestions.thankYouMessage)}
                    className="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Appliquer
                  </button>
                </div>
                <p className="text-sm text-white">{aiSuggestions.thankYouMessage}</p>
              </div>
            )}

            {aiSuggestions.tips && aiSuggestions.tips.length > 0 && (
              <div className="bg-warning/20/30 border border-warning/50 rounded-lg p-3">
                <span className="text-xs text-warning font-medium">💡 Conseils</span>
                <ul className="mt-2 space-y-1">
                  {aiSuggestions.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-200">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={applyAllSuggestions}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Appliquer toutes les suggestions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
