"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  FileText,
  ArrowLeft,
  Save,
  Eye,
  Code,
} from "lucide-react";

const CATEGORIES = [
  { value: "WELCOME", label: "Bienvenue" },
  { value: "THANK_YOU", label: "Remerciement" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "APPEAL", label: "Appel aux dons" },
  { value: "EVENT", label: "Événement" },
  { value: "REMINDER", label: "Rappel" },
  { value: "BIRTHDAY", label: "Anniversaire" },
  { value: "REACTIVATION", label: "Réactivation" },
  { value: "RECEIPT", label: "Reçu fiscal" },
  { value: "GENERAL", label: "Général" },
];

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{organizationName}}</h1>
    </div>
    <div class="content">
      <p>Bonjour {{firstName}},</p>
      <p>Votre contenu ici...</p>
      <a href="{{ctaUrl}}" class="button">En savoir plus</a>
    </div>
    <div class="footer">
      <p>© {{year}} {{organizationName}}. Tous droits réservés.</p>
      <p><a href="{{unsubscribeUrl}}">Se désabonner</a></p>
    </div>
  </div>
</body>
</html>`;

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "GENERAL",
    subject: "",
    preheader: "",
    htmlContent: DEFAULT_HTML,
    textContent: "",
    variables: ["firstName", "lastName", "organizationName", "year", "ctaUrl", "unsubscribeUrl"],
    primaryColor: "#6366f1",
    footerText: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const template = await res.json();
        router.push(`/marketing/templates/${template.id}`);
      } else {
        alert("Erreur lors de la création du template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Erreur lors de la création du template");
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Templates", href: "/marketing/templates" },
    { name: "Nouveau template", href: "/marketing/templates/new" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Nouveau template email</h1>
              <p className="text-gray-400 text-sm">Créez un modèle réutilisable</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Éditeur" : "Aperçu"}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.subject}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-400" />
                Informations
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Email de bienvenue"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du template..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Objet de l&apos;email *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Bienvenue chez nous, {{firstName}} !"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
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
                  placeholder="Texte affiché après l'objet..."
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
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Template actif (disponible pour les campagnes)
                </label>
              </div>
            </div>

            {/* Variables */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-white mb-3">Variables disponibles</h3>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map((v) => (
                  <code key={v} className="px-2 py-1 bg-slate-700 rounded text-sm text-pink-400">
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Utilisez ces variables dans votre template pour personnaliser les emails.
              </p>
            </div>
          </div>

          {/* Right Column - Editor/Preview */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              {showPreview ? (
                <div className="p-4">
                  <div className="bg-white rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={formData.htmlContent
                        .replace(/\{\{firstName\}\}/g, "Jean")
                        .replace(/\{\{lastName\}\}/g, "Tremblay")
                        .replace(/\{\{organizationName\}\}/g, "Nucleus Cause")
                        .replace(/\{\{year\}\}/g, new Date().getFullYear().toString())
                        .replace(/\{\{subject\}\}/g, formData.subject || "Objet de l'email")
                        .replace(/\{\{ctaUrl\}\}/g, "#")
                        .replace(/\{\{unsubscribeUrl\}\}/g, "#")}
                      className="w-full h-[600px] border-0"
                      title="Aperçu du template"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu HTML
                  </label>
                  <textarea
                    value={formData.htmlContent}
                    onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                    className="w-full h-[600px] px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-pink-500"
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
