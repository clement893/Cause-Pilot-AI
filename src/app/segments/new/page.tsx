"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Zap,
  Layers,
} from "lucide-react";

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

const FIELDS = [
  { value: "totalDonated", label: "Total donné", type: "number" },
  { value: "donationCount", label: "Nombre de dons", type: "number" },
  { value: "lastDonationDate", label: "Dernier don", type: "date" },
  { value: "createdAt", label: "Date d'inscription", type: "date" },
  { value: "isRecurring", label: "Donateur récurrent", type: "boolean" },
  { value: "status", label: "Statut", type: "select", options: ["ACTIVE", "INACTIVE", "LAPSED"] },
  { value: "segment", label: "Segment actuel", type: "select", options: ["PROSPECT", "NEW", "ACTIVE", "LAPSED", "MAJOR", "VIP"] },
  { value: "city", label: "Ville", type: "text" },
  { value: "province", label: "Province", type: "text" },
];

const OPERATORS = {
  number: [
    { value: "equals", label: "Égal à" },
    { value: "not_equals", label: "Différent de" },
    { value: "greater_than", label: "Supérieur à" },
    { value: "greater_than_or_equal", label: "Supérieur ou égal à" },
    { value: "less_than", label: "Inférieur à" },
    { value: "less_than_or_equal", label: "Inférieur ou égal à" },
  ],
  text: [
    { value: "equals", label: "Égal à" },
    { value: "not_equals", label: "Différent de" },
    { value: "contains", label: "Contient" },
    { value: "starts_with", label: "Commence par" },
    { value: "ends_with", label: "Termine par" },
    { value: "is_null", label: "Est vide" },
    { value: "is_not_null", label: "N'est pas vide" },
  ],
  date: [
    { value: "in_last_days", label: "Dans les X derniers jours" },
    { value: "not_in_last_days", label: "Pas dans les X derniers jours" },
    { value: "is_null", label: "Jamais" },
    { value: "is_not_null", label: "Au moins une fois" },
  ],
  boolean: [
    { value: "is_true", label: "Oui" },
    { value: "is_false", label: "Non" },
  ],
  select: [
    { value: "equals", label: "Égal à" },
    { value: "not_equals", label: "Différent de" },
  ],
};

const COLORS = [
  "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#10B981",
  "#3B82F6", "#6366F1", "#14B8A6", "#F97316", "#84CC16",
];

export default function NewSegmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [type, setType] = useState<"STATIC" | "DYNAMIC">("DYNAMIC");
  const [logicOperator, setLogicOperator] = useState<"AND" | "OR">("AND");
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", field: "totalDonated", operator: "greater_than_or_equal", value: 100 },
  ]);

  const addRule = () => {
    setRules([
      ...rules,
      { id: Date.now().toString(), field: "totalDonated", operator: "greater_than_or_equal", value: 0 },
    ]);
  };

  const removeRule = (id: string) => {
    if (rules.length > 1) {
      setRules(rules.filter((r) => r.id !== id));
    }
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const getFieldType = (fieldValue: string) => {
    const field = FIELDS.find((f) => f.value === fieldValue);
    return field?.type || "text";
  };

  const getFieldOptions = (fieldValue: string) => {
    const field = FIELDS.find((f) => f.value === fieldValue);
    return field?.options || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          color,
          type,
          rules: type === "DYNAMIC" ? {
            operator: logicOperator,
            rules: rules.map((r) => ({
              field: r.field,
              operator: r.operator,
              value: r.value,
            })),
          } : null,
        }),
      });

      if (res.ok) {
        router.push("/segments");
      }
    } catch (error) {
      console.error("Error creating segment:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/segments"
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Nouveau segment</h1>
            <p className="text-gray-400 mt-1">
              Créez un segment pour cibler vos donateurs
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Informations de base */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Informations générales
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du segment *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Donateurs majeurs"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur
                </label>
                <div className="flex items-center gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        color === c ? "ring-2 ring-white scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle du segment..."
                rows={2}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Type de segment */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Type de segment
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType("DYNAMIC")}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  type === "DYNAMIC"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Dynamique</p>
                    <p className="text-xs text-gray-400">Mise à jour automatique</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Les donateurs sont automatiquement ajoutés ou retirés selon les règles définies.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType("STATIC")}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  type === "STATIC"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Statique</p>
                    <p className="text-xs text-gray-400">Liste manuelle</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Vous ajoutez manuellement les donateurs à ce segment.
                </p>
              </button>
            </div>
          </div>

          {/* Règles (pour segments dynamiques) */}
          {type === "DYNAMIC" && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Règles de segmentation
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Combiner avec</span>
                  <select
                    value={logicOperator}
                    onChange={(e) => setLogicOperator(e.target.value as "AND" | "OR")}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="AND">ET (toutes les conditions)</option>
                    <option value="OR">OU (au moins une condition)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {rules.map((rule, index) => {
                  const fieldType = getFieldType(rule.field);
                  const operators = OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.text;
                  const options = getFieldOptions(rule.field);

                  return (
                    <div
                      key={rule.id}
                      className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg"
                    >
                      {index > 0 && (
                        <span className="text-sm text-purple-400 font-medium w-8">
                          {logicOperator}
                        </span>
                      )}
                      {index === 0 && <span className="w-8" />}

                      {/* Champ */}
                      <select
                        value={rule.field}
                        onChange={(e) => updateRule(rule.id, { field: e.target.value, operator: "equals", value: "" })}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {FIELDS.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      {/* Opérateur */}
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Valeur */}
                      {!["is_null", "is_not_null", "is_true", "is_false"].includes(rule.operator) && (
                        <>
                          {fieldType === "select" ? (
                            <select
                              value={rule.value}
                              onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Sélectionner...</option>
                              {options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={fieldType === "number" || fieldType === "date" ? "number" : "text"}
                              value={rule.value}
                              onChange={(e) => updateRule(rule.id, { 
                                value: fieldType === "number" || fieldType === "date" 
                                  ? Number(e.target.value) 
                                  : e.target.value 
                              })}
                              placeholder={fieldType === "date" ? "Nombre de jours" : "Valeur"}
                              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          )}
                        </>
                      )}

                      {/* Supprimer */}
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        disabled={rules.length === 1}
                        className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addRule}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-800 border border-dashed border-slate-600 text-gray-400 rounded-lg hover:border-purple-500 hover:text-purple-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une condition
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/segments"
              className="px-6 py-2 bg-slate-800 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Créer le segment
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
