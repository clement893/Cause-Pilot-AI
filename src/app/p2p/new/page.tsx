"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  ArrowLeft,
  Save,
  User,
  Target,
  FileText,
  Image,
  Palette,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  allowP2P: boolean;
  status: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function NewP2PPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    campaignId: "",
    teamId: "",
    title: "",
    story: "",
    goalAmount: 500,
    videoUrl: "",
    primaryColor: "#6366f1",
    photoUrl: "",
    coverImageUrl: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (formData.campaignId) {
      fetchTeams(formData.campaignId);
    }
  }, [formData.campaignId]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns?status=ACTIVE&allowP2P=true");
      const data = await res.json();
      // Filtrer les campagnes qui permettent le P2P
      setCampaigns(data.campaigns?.filter((c: Campaign) => c.allowP2P) || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchTeams = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/p2p/teams?campaignId=${campaignId}&status=ACTIVE`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/p2p/fundraisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          title: formData.title || `Collecte de ${formData.firstName}`,
          teamId: formData.teamId || null,
        }),
      });

      if (res.ok) {
        const fundraiser = await res.json();
        router.push(`/p2p/fundraisers/${fundraiser.id}`);
      } else {
        alert("Erreur lors de la création de la page");
      }
    } catch (error) {
      console.error("Error creating fundraiser:", error);
      alert("Erreur lors de la création de la page");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.firstName && formData.lastName && formData.email && formData.campaignId;
    }
    if (step === 2) {
      return formData.goalAmount > 0;
    }
    return true;
  };

  const breadcrumbs = [
    { name: "Campagnes P2P", href: "/p2p" },
    { name: "Nouvelle page", href: "/p2p/new" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Nouvelle page de collecte P2P</h1>
            <p className="text-gray-400 text-sm">Créez une page de collecte personnalisée</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-pink-500 text-white"
                    : "bg-slate-700 text-gray-400"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step > s ? "bg-pink-500" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Informations personnelles */}
        {step === 1 && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-pink-400" />
              Informations personnelles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Tremblay"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@exemple.com"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="514-555-1234"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campagne *
              </label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value, teamId: "" })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
              >
                <option value="">Sélectionner une campagne</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {campaigns.length === 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  Aucune campagne P2P active. Créez d&apos;abord une campagne avec l&apos;option P2P activée.
                </p>
              )}
            </div>

            {teams.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejoindre une équipe (optionnel)
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="">Collecte individuelle</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Objectif et histoire */}
        {step === 2 && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-400" />
              Objectif et histoire
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titre de votre page
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={`Collecte de ${formData.firstName || "..."}`}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Objectif de collecte *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData({ ...formData, goalAmount: parseInt(e.target.value) || 0 })}
                  className="w-40 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
                <span className="text-gray-400">CAD</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[250, 500, 1000, 2500, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setFormData({ ...formData, goalAmount: amount })}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      formData.goalAmount === amount
                        ? "bg-pink-500 text-white"
                        : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    }`}
                  >
                    {amount}$
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Votre histoire
              </label>
              <textarea
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="Expliquez pourquoi cette cause vous tient à cœur et pourquoi vous collectez des fonds..."
                rows={5}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Une histoire personnelle augmente les dons de 30% en moyenne
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lien vidéo (optionnel)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        )}

        {/* Step 3: Personnalisation */}
        {step === 3 && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              Personnalisation
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                Photo de profil (URL)
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://exemple.com/photo.jpg"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image de couverture (URL)
              </label>
              <input
                type="url"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://exemple.com/cover.jpg"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Couleur principale
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-32 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-900 rounded-lg">
              <p className="text-sm text-gray-400 mb-3">Aperçu de votre page</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {formData.firstName?.[0] || "?"}{formData.lastName?.[0] || "?"}
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {formData.title || `Collecte de ${formData.firstName || "..."}`}
                  </h3>
                  <p className="text-sm text-gray-400">
                    par {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-sm text-green-400">
                    Objectif: {formData.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Création..." : "Créer ma page"}
            </button>
          )}
        </div>
      </form>
    </AppLayout>
  );
}
