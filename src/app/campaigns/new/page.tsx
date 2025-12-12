"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  CampaignType,
  CampaignPriority,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_PRIORITY_LABELS,
} from "@/types/campaign";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    campaignType: "FUNDRAISING" as CampaignType,
    priority: "MEDIUM" as CampaignPriority,
    startDate: "",
    endDate: "",
    goalAmount: "",
    minimumGoal: "",
    stretchGoal: "",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    thankYouMessage: "",
    impactStatement: "",
    isPublic: true,
    allowP2P: false,
    enableMatching: false,
    matchingRatio: "",
    matchingCap: "",
    category: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
          goalAmount: formData.goalAmount ? parseFloat(formData.goalAmount) : null,
          minimumGoal: formData.minimumGoal ? parseFloat(formData.minimumGoal) : null,
          stretchGoal: formData.stretchGoal ? parseFloat(formData.stretchGoal) : null,
          matchingRatio: formData.matchingRatio ? parseFloat(formData.matchingRatio) : null,
          matchingCap: formData.matchingCap ? parseFloat(formData.matchingCap) : null,
        }),
      });

      if (response.ok) {
        const campaign = await response.json();
        router.push(`/campaigns/${campaign.id}`);
      } else {
        alert("Erreur lors de la création de la campagne");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de la création de la campagne");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Nouvelle Campagne"
      breadcrumbs={[
        { name: "Accueil", href: "/" },
        { name: "Campagnes", href: "/campaigns" },
        { name: "Nouvelle", href: "/campaigns/new" },
      ]}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Informations générales */}
        <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informations générales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nom de la campagne *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Ex: Campagne de fin d'année 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Type de campagne
              </label>
              <select
                value={formData.campaignType}
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value as CampaignType })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {Object.entries(CAMPAIGN_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as CampaignPriority })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {Object.entries(CAMPAIGN_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description courte
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Résumé en une phrase"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description complète
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Description détaillée de la campagne..."
              />
            </div>
          </div>
        </div>

        {/* Dates et objectifs */}
        <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Dates et objectifs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Objectif principal ($)
              </label>
              <input
                type="number"
                value={formData.goalAmount}
                onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Objectif minimum ($)
              </label>
              <input
                type="number"
                value={formData.minimumGoal}
                onChange={(e) => setFormData({ ...formData, minimumGoal: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="25000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Objectif étendu ($)
              </label>
              <input
                type="number"
                value={formData.stretchGoal}
                onChange={(e) => setFormData({ ...formData, stretchGoal: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="75000"
              />
            </div>
          </div>
        </div>

        {/* Personnalisation */}
        <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Personnalisation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Couleur principale
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Couleur secondaire
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Message de remerciement
              </label>
              <textarea
                value={formData.thankYouMessage}
                onChange={(e) => setFormData({ ...formData, thankYouMessage: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Merci pour votre générosité..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Ex: Éducation, Santé, Environnement"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="urgence, enfants, local"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-surface-secondary/50 rounded-xl p-6 border border-border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Options</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 rounded border-border text-accent focus:ring-pink-500"
              />
              <span className="text-slate-300">Campagne publique</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowP2P}
                onChange={(e) => setFormData({ ...formData, allowP2P: e.target.checked })}
                className="w-5 h-5 rounded border-border text-accent focus:ring-pink-500"
              />
              <span className="text-slate-300">Autoriser les collectes peer-to-peer</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableMatching}
                onChange={(e) => setFormData({ ...formData, enableMatching: e.target.checked })}
                className="w-5 h-5 rounded border-border text-accent focus:ring-pink-500"
              />
              <span className="text-slate-300">Activer le matching de dons</span>
            </label>

            {formData.enableMatching && (
              <div className="grid grid-cols-2 gap-4 ml-8">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ratio de matching
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.matchingRatio}
                    onChange={(e) => setFormData({ ...formData, matchingRatio: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="2.0 (pour 2:1)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Plafond du matching ($)
                  </label>
                  <input
                    type="number"
                    value={formData.matchingCap}
                    onChange={(e) => setFormData({ ...formData, matchingCap: e.target.value })}
                    className="w-full px-4 py-2 bg-surface-tertiary border border-border rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="10000"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-surface-tertiary hover:bg-surface-elevated text-white rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2 bg-accent hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Créer la campagne"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
