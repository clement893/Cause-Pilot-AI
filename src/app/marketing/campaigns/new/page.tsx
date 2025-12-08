"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Mail,
  FileText,
  Users,
  Calendar,
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  description: string | null;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaignType: "ONE_TIME",
    templateId: "",
    subject: "",
    preheader: "",
    fromName: "Nucleus Cause",
    fromEmail: "noreply@nucleuscause.com",
    replyTo: "",
    segments: [] as string[],
    tags: [] as string[],
    scheduledAt: "",
    isABTest: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/marketing/templates?isActive=true");
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledAt: formData.scheduledAt || null,
        }),
      });

      if (res.ok) {
        const campaign = await res.json();
        router.push(`/marketing/campaigns/${campaign.id}`);
      } else {
        alert("Erreur lors de la création de la campagne");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Erreur lors de la création de la campagne");
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === formData.templateId);

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Campagnes", href: "/marketing/campaigns" },
    { name: "Nouvelle campagne", href: "/marketing/campaigns/new" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Nouvelle campagne email</h1>
          <p className="text-gray-400 mt-1">
            Créez et configurez votre campagne en quelques étapes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Informations", icon: Mail },
            { num: 2, label: "Template", icon: FileText },
            { num: 3, label: "Destinataires", icon: Users },
            { num: 4, label: "Planification", icon: Calendar },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  step === s.num
                    ? "bg-pink-500/20 text-pink-400"
                    : step > s.num
                    ? "bg-green-500/20 text-green-400"
                    : "bg-slate-800 text-gray-400"
                }`}
              >
                {step > s.num ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 3 && (
                <div className={`w-8 h-0.5 mx-2 ${step > s.num ? "bg-green-500" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Informations de base</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom de la campagne *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Newsletter de décembre"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description interne de la campagne..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type de campagne
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "ONE_TIME", label: "Ponctuel", desc: "Envoi unique" },
                    { value: "RECURRING", label: "Récurrent", desc: "Envoi périodique" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, campaignType: type.value })}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        formData.campaignType === type.value
                          ? "border-pink-500 bg-pink-500/10"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="font-medium text-white">{type.label}</div>
                      <div className="text-sm text-gray-400">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom de lexpéditeur
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email de réponse
                  </label>
                  <input
                    type="email"
                    value={formData.replyTo}
                    onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                    placeholder="reponse@exemple.com"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Template */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Choisir un template</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, templateId: "" })}
                  className={`p-6 rounded-lg border text-left transition-colors ${
                    !formData.templateId
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <FileText className="w-8 h-8 text-gray-400 mb-3" />
                  <div className="font-medium text-white">Email personnalisé</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Créer un email de zéro
                  </div>
                </button>

                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        templateId: template.id,
                        subject: template.subject,
                      })
                    }
                    className={`p-6 rounded-lg border text-left transition-colors ${
                      formData.templateId === template.id
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-6 h-6 text-pink-400" />
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-gray-300">
                        {template.category}
                      </span>
                    </div>
                    <div className="font-medium text-white">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-gray-400 mt-1">
                        {template.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Objet de lemail *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Votre impact ce mois-ci 🎉"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Texte de prévisualisation
                </label>
                <input
                  type="text"
                  value={formData.preheader}
                  onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                  placeholder="Texte affiché après l'objet dans la boîte de réception"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Destinataires</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Segments de donateurs
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Actifs", "Majeurs", "Récurrents", "Nouveaux", "Inactifs", "VIP"].map(
                    (segment) => (
                      <button
                        key={segment}
                        type="button"
                        onClick={() => {
                          const segments = formData.segments.includes(segment)
                            ? formData.segments.filter((s) => s !== segment)
                            : [...formData.segments, segment];
                          setFormData({ ...formData, segments });
                        }}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          formData.segments.includes(segment)
                            ? "border-pink-500 bg-pink-500/10 text-pink-400"
                            : "border-slate-700 text-gray-400 hover:border-slate-600"
                        }`}
                      >
                        {segment}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Entrez des tags séparés par des virgules"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Estimation des destinataires</span>
                </div>
                <p className="text-gray-300">
                  Basé sur vos critères, cette campagne sera envoyée à environ{" "}
                  <strong className="text-white">
                    {formData.segments.length > 0 ? "~500" : "tous les"} donateurs
                  </strong>
                  {formData.segments.length === 0 && " avec consentement email"}.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Schedule */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Planification</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduledAt: "" })}
                  className={`p-6 rounded-lg border text-left transition-colors ${
                    !formData.scheduledAt
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Send className="w-8 h-8 text-pink-400 mb-3" />
                  <div className="font-medium text-white">Enregistrer comme brouillon</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Envoyer manuellement plus tard
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                    })
                  }
                  className={`p-6 rounded-lg border text-left transition-colors ${
                    formData.scheduledAt
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <Calendar className="w-8 h-8 text-blue-400 mb-3" />
                  <div className="font-medium text-white">Planifier lenvoi</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Choisir une date et heure
                  </div>
                </button>
              </div>

              {formData.scheduledAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date et heure denvoi
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}

              {/* Summary */}
              <div className="p-6 bg-slate-900 rounded-lg border border-slate-700">
                <h3 className="font-semibold text-white mb-4">Récapitulatif</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Nom</dt>
                    <dd className="text-white">{formData.name || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Type</dt>
                    <dd className="text-white">
                      {formData.campaignType === "ONE_TIME" ? "Ponctuel" : "Récurrent"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Template</dt>
                    <dd className="text-white">{selectedTemplate?.name || "Personnalisé"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Objet</dt>
                    <dd className="text-white">{formData.subject || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Segments</dt>
                    <dd className="text-white">
                      {formData.segments.length > 0 ? formData.segments.join(", ") : "Tous"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-400">Planification</dt>
                    <dd className="text-white">
                      {formData.scheduledAt
                        ? new Date(formData.scheduledAt).toLocaleString("fr-CA")
                        : "Brouillon"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {step > 1 ? "Précédent" : "Annuler"}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !formData.name}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.name}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création..." : "Créer la campagne"}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
