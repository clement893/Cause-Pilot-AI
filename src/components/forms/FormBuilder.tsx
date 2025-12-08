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

interface FormBuilderProps {
  initialData?: DonationForm;
  mode: "create" | "edit";
}

const SUGGESTED_AMOUNTS_PRESETS = {
  standard: [25, 50, 100, 250, 500],
  small: [10, 25, 50, 100, 200],
  large: [100, 250, 500, 1000, 2500],
  custom: [],
};

export default function FormBuilder({ initialData, mode }: FormBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Section: Informations générales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informations générales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du formulaire *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Don de fin d'année 2024"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Décrivez l'objectif de ce formulaire..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de formulaire
            </label>
            <select
              value={formData.formType}
              onChange={(e) => updateField("formType", e.target.value as FormType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => updateField("status", e.target.value as FormStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="SCHEDULED">Planifié</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Configuration des montants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Configuration des montants
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montants suggérés
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.suggestedAmounts?.map((amount, index) => (
                <div key={index} className="flex items-center bg-indigo-100 rounded-lg px-3 py-1">
                  <span className="text-indigo-800 font-medium">{amount} $</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newAmounts = formData.suggestedAmounts?.filter((_, i) => i !== index);
                      updateField("suggestedAmounts", newAmounts);
                    }}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                type="number"
                placeholder="Ajouter..."
                className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm"
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
            <p className="text-xs text-gray-500">Appuyez sur Entrée pour ajouter un montant</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant minimum
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={formData.minimumAmount}
                onChange={(e) => updateField("minimumAmount", parseFloat(e.target.value))}
                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant maximum (optionnel)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={formData.maximumAmount || ""}
                onChange={(e) => updateField("maximumAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Aucune limite"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectif de collecte (optionnel)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={formData.goalAmount || ""}
                onChange={(e) => updateField("goalAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: 50000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowCustomAmount"
              checked={formData.allowCustomAmount}
              onChange={(e) => updateField("allowCustomAmount", e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="allowCustomAmount" className="ml-2 text-sm text-gray-700">
              Permettre un montant personnalisé
            </label>
          </div>
        </div>

        {/* Options récurrentes si type récurrent */}
        {formData.formType === "RECURRING" && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Options de récurrence</h3>
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
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informations à collecter
        </h2>
        
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
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section: Personnalisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Personnalisation
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur principale
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur secondaire
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message de remerciement
            </label>
            <textarea
              value={formData.thankYouMessage}
              onChange={(e) => updateField("thankYouMessage", e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
  );
}
