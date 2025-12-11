"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { sanitizeEmailHTML } from "@/lib/sanitize";
import {
  Mail,
  FileText,
  Users,
  Eye,
  Send,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Wand2,
  RefreshCw,
  Save,
  TestTube,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  description: string | null;
  htmlContent: string;
  textContent: string;
}

interface Segment {
  id: string;
  type: string;
  name: string;
  description?: string;
  value?: string;
  count: number;
}

interface SegmentsData {
  totalEligible: number;
  predefinedSegments: Segment[];
  segments: Segment[];
  statuses: Segment[];
  types: Segment[];
  tags: Segment[];
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segmentsData, setSegmentsData] = useState<SegmentsData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    predefined: true,
    segments: false,
    statuses: false,
    types: false,
    tags: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaignType: "ONE_TIME",
    templateId: "",
    subject: "",
    preheader: "",
    htmlContent: "",
    textContent: "",
    fromName: "CausePilotAI",
    fromEmail: "hello@nukleo.digital",
    replyTo: "",
    selectedSegments: [] as string[],
    scheduledAt: "",
    isABTest: false,
    aiTone: "professional" as "professional" | "friendly" | "urgent" | "inspirational",
    aiContext: "",
  });

  useEffect(() => {
    fetchTemplates();
    fetchSegments();
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

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/donors/segments?includeCount=true");
      const data = await res.json();
      setSegmentsData(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/marketing/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          context: formData.aiContext || formData.description,
          subject: formData.subject,
          tone: formData.aiTone,
          campaignType: formData.campaignType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...formData,
          subject: data.subject || formData.subject,
          preheader: data.preheader || formData.preheader,
          htmlContent: data.htmlContent || "",
          textContent: data.textContent || "",
        });
      } else {
        alert("Erreur lors de la génération du contenu");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Erreur lors de la génération du contenu");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIImprove = async () => {
    if (!formData.htmlContent) {
      alert("Veuillez d'abord générer ou saisir du contenu");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/marketing/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improve",
          subject: formData.subject,
          content: formData.htmlContent,
          tone: formData.aiTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...formData,
          subject: data.subject || formData.subject,
          preheader: data.preheader || formData.preheader,
          htmlContent: data.htmlContent || formData.htmlContent,
          textContent: data.textContent || formData.textContent,
        });
      }
    } catch (error) {
      console.error("Error improving content:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      alert("Veuillez saisir une adresse email de test");
      return;
    }
    if (!formData.htmlContent) {
      alert("Veuillez d'abord créer le contenu de l'email");
      return;
    }

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/marketing/campaigns/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail,
          subject: formData.subject,
          htmlContent: formData.htmlContent,
          textContent: formData.textContent,
          fromName: formData.fromName,
          preheader: formData.preheader,
        }),
      });

      const data = await res.json();
      setTestResult({
        success: res.ok,
        message: data.message || data.error,
      });
    } catch (error) {
      console.error("Error sending test:", error);
      setTestResult({
        success: false,
        message: "Erreur lors de l'envoi du test",
      });
    } finally {
      setTestSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name) {
      alert("Veuillez saisir un nom pour la campagne");
      return;
    }

    setSaving(true);
    try {
      const method = savedCampaignId ? "PUT" : "POST";
      const url = savedCampaignId
        ? `/api/marketing/campaigns/${savedCampaignId}`
        : "/api/marketing/campaigns";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          campaignType: formData.campaignType,
          templateId: formData.templateId || null,
          subject: formData.subject,
          preheader: formData.preheader,
          htmlContent: formData.htmlContent,
          fromName: formData.fromName,
          fromEmail: formData.fromEmail,
          replyTo: formData.replyTo,
          segments: formData.selectedSegments,
          scheduledAt: formData.scheduledAt || null,
          status: "DRAFT",
        }),
      });

      if (res.ok) {
        const campaign = await res.json();
        setSavedCampaignId(campaign.id);
        alert("Brouillon sauvegardé avec succès!");
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!savedCampaignId) {
      // Sauvegarder d'abord
      await handleSaveDraft();
    }

    if (!savedCampaignId && !formData.name) {
      alert("Veuillez d'abord sauvegarder la campagne");
      return;
    }

    const campaignId = savedCampaignId;
    if (!campaignId) return;

    if (!confirm(`Êtes-vous sûr de vouloir envoyer cette campagne à ${getSelectedRecipientsCount()} destinataires?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/send`, {
        method: "POST",
      });

      if (res.ok) {
        router.push(`/marketing/campaigns/${campaignId}`);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Erreur lors de l'envoi de la campagne");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedRecipientsCount = useCallback(() => {
    if (!segmentsData) return 0;
    if (formData.selectedSegments.length === 0) return segmentsData.totalEligible;
    if (formData.selectedSegments.includes("all")) return segmentsData.totalEligible;

    let count = 0;
    formData.selectedSegments.forEach((segId) => {
      const allSegments = [
        ...segmentsData.predefinedSegments,
        ...segmentsData.segments,
        ...segmentsData.statuses,
        ...segmentsData.types,
        ...segmentsData.tags,
      ];
      const segment = allSegments.find((s) => s.id === segId);
      if (segment) count += segment.count;
    });
    return count;
  }, [segmentsData, formData.selectedSegments]);

  const toggleSegment = (segmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSegments: prev.selectedSegments.includes(segmentId)
        ? prev.selectedSegments.filter((id) => id !== segmentId)
        : [...prev.selectedSegments, segmentId],
    }));
  };

  const selectedTemplate = templates.find((t) => t.id === formData.templateId);

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Campagnes", href: "/marketing/campaigns" },
    { name: "Nouvelle campagne", href: "/marketing/campaigns/new" },
  ];

  const steps = [
    { num: 1, label: "Configuration", icon: Mail },
    { num: 2, label: "Rédaction IA", icon: Sparkles },
    { num: 3, label: "Destinataires", icon: Users },
    { num: 4, label: "Prévisualisation", icon: Eye },
    { num: 5, label: "Test & Envoi", icon: Send },
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.subject;
      case 2:
        return formData.htmlContent;
      case 3:
        return true; // Segments optionnels
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Nouvelle campagne email</h1>
            <p className="text-gray-400 mt-1">
              Créez votre campagne avec l&apos;assistance de l&apos;IA
            </p>
          </div>
          <button
            onClick={handleSaveDraft}
            disabled={saving || !formData.name}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder brouillon
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  step === s.num
                    ? "bg-pink-500/20 text-pink-400"
                    : step > s.num
                    ? "bg-green-500/20 text-green-400"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                }`}
              >
                {step > s.num ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="hidden md:inline text-sm">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 ${step > s.num ? "bg-green-500" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-pink-400" />
                Configuration de la campagne
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Type de campagne
                  </label>
                  <select
                    value={formData.campaignType}
                    onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="ONE_TIME">Ponctuel</option>
                    <option value="RECURRING">Récurrent</option>
                    <option value="AUTOMATED">Automatisé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Objet de l&apos;email *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Votre soutien fait la différence"
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
                  maxLength={100}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.preheader.length}/100 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (contexte pour l&apos;IA)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez l'objectif de cette campagne pour aider l'IA à générer un contenu pertinent..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom de l&apos;expéditeur
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

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template de base (optionnel)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, templateId: "" })}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      !formData.templateId
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <Sparkles className="w-6 h-6 text-pink-400 mb-2" />
                    <div className="font-medium text-white text-sm">Générer avec IA</div>
                  </button>

                  {templates.slice(0, 5).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          templateId: template.id,
                          subject: template.subject || formData.subject,
                          htmlContent: template.htmlContent || "",
                          textContent: template.textContent || "",
                        })
                      }
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        formData.templateId === template.id
                          ? "border-pink-500 bg-pink-500/10"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <FileText className="w-6 h-6 text-purple-400 mb-2" />
                      <div className="font-medium text-white text-sm truncate">{template.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Content Generation */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Rédaction assistée par IA
              </h2>

              {/* AI Controls */}
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-6 border border-pink-500/20">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Ton</label>
                    <select
                      value={formData.aiTone}
                      onChange={(e) => setFormData({ ...formData, aiTone: e.target.value as typeof formData.aiTone })}
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
                    >
                      <option value="professional">Professionnel</option>
                      <option value="friendly">Chaleureux</option>
                      <option value="urgent">Urgent</option>
                      <option value="inspirational">Inspirant</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Contexte additionnel</label>
                    <input
                      type="text"
                      value={formData.aiContext}
                      onChange={(e) => setFormData({ ...formData, aiContext: e.target.value })}
                      placeholder="Ex: Campagne de fin d'année, urgence humanitaire..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    Générer le contenu
                  </button>

                  <button
                    onClick={handleAIImprove}
                    disabled={aiLoading || !formData.htmlContent}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Améliorer
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Objet de l&apos;email
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* HTML Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contenu HTML
                </label>
                <textarea
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder="Le contenu HTML de votre email sera généré ici..."
                  rows={15}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables disponibles: {"{{firstName}}"}, {"{{lastName}}"}, {"{{email}}"}, {"{{date}}"}
                </p>
              </div>

              {/* Text Content */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Version texte (fallback)
                </label>
                <textarea
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  placeholder="Version texte brut pour les clients email qui ne supportent pas le HTML..."
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                Sélection des destinataires
              </h2>

              {segmentsData && (
                <>
                  {/* Summary */}
                  <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Destinataires sélectionnés</p>
                      <p className="text-2xl font-bold text-white">{getSelectedRecipientsCount().toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Total éligible</p>
                      <p className="text-lg text-gray-300">{segmentsData.totalEligible.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Predefined Segments */}
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSections({ ...expandedSections, predefined: !expandedSections.predefined })}
                      className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700"
                    >
                      <span className="font-medium text-white">Segments prédéfinis</span>
                      {expandedSections.predefined ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                    {expandedSections.predefined && (
                      <div className="p-4 space-y-2">
                        {segmentsData.predefinedSegments.map((segment) => (
                          <label
                            key={segment.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              formData.selectedSegments.includes(segment.id)
                                ? "bg-pink-500/20 border border-pink-500"
                                : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={formData.selectedSegments.includes(segment.id)}
                                onChange={() => toggleSegment(segment.id)}
                                className="w-4 h-4 rounded border-slate-600 text-pink-500 focus:ring-pink-500"
                              />
                              <div>
                                <p className="text-white font-medium">{segment.name}</p>
                                {segment.description && (
                                  <p className="text-gray-400 text-sm">{segment.description}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-400 text-sm">{segment.count.toLocaleString()}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Segments */}
                  {segmentsData.segments.length > 0 && (
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSections({ ...expandedSections, segments: !expandedSections.segments })}
                        className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700"
                      >
                        <span className="font-medium text-white">Segments personnalisés</span>
                        {expandedSections.segments ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </button>
                      {expandedSections.segments && (
                        <div className="p-4 grid grid-cols-2 gap-2">
                          {segmentsData.segments.map((segment) => (
                            <label
                              key={segment.id}
                              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                formData.selectedSegments.includes(segment.id)
                                  ? "bg-pink-500/20 border border-pink-500"
                                  : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedSegments.includes(segment.id)}
                                  onChange={() => toggleSegment(segment.id)}
                                  className="w-4 h-4 rounded border-slate-600 text-pink-500 focus:ring-pink-500"
                                />
                                <span className="text-white text-sm">{segment.name}</span>
                              </div>
                              <span className="text-gray-400 text-xs">{segment.count}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {segmentsData.tags.length > 0 && (
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSections({ ...expandedSections, tags: !expandedSections.tags })}
                        className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700"
                      >
                        <span className="font-medium text-white">Par tags</span>
                        {expandedSections.tags ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </button>
                      {expandedSections.tags && (
                        <div className="p-4 flex flex-wrap gap-2">
                          {segmentsData.tags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => toggleSegment(tag.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                formData.selectedSegments.includes(tag.id)
                                  ? "bg-pink-500 text-white"
                                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                              }`}
                            >
                              {tag.name} ({tag.count})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!segmentsData && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-400">Chargement des segments...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-400" />
                Prévisualisation
              </h2>

              {/* Email Preview */}
              <div className="bg-white rounded-lg overflow-hidden">
                {/* Email Header Preview */}
                <div className="bg-gray-100 p-4 border-b">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {formData.fromName?.[0] || "C"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formData.fromName || "CausePilotAI"}</p>
                      <p className="text-sm text-gray-500">{formData.fromEmail}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{formData.subject || "Sans objet"}</p>
                  {formData.preheader && (
                    <p className="text-sm text-gray-500 truncate">{formData.preheader}</p>
                  )}
                </div>

                {/* Email Body Preview */}
                <div className="p-6 min-h-[400px]">
                  {formData.htmlContent ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeEmailHTML(formData.htmlContent
                          .replace(/{{firstName}}/g, "Jean")
                          .replace(/{{lastName}}/g, "Dupont")
                          .replace(/{{email}}/g, "jean.dupont@exemple.com")
                          .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"))),
                      }}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun contenu à prévisualiser</p>
                      <p className="text-sm">Retournez à l&apos;étape de rédaction pour créer votre email</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Info */}
              <div className="bg-slate-900 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Récapitulatif</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Destinataires</p>
                    <p className="text-white font-medium">{getSelectedRecipientsCount().toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Expéditeur</p>
                    <p className="text-white font-medium">{formData.fromName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Type</p>
                    <p className="text-white font-medium">
                      {formData.campaignType === "ONE_TIME" ? "Ponctuel" : formData.campaignType === "RECURRING" ? "Récurrent" : "Automatisé"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Statut</p>
                    <p className="text-yellow-400 font-medium">Brouillon</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Test & Send */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-pink-400" />
                Test et envoi
              </h2>

              {/* Test Email */}
              <div className="bg-slate-900 rounded-lg p-6">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-blue-400" />
                  Envoyer un email de test
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={testSending || !testEmail}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Envoyer test
                  </button>
                </div>
                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${testResult.success ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {testResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* Campaign Summary */}
              <div className="bg-slate-900 rounded-lg p-6">
                <h3 className="font-medium text-white mb-4">Récapitulatif de la campagne</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-gray-400">Nom</span>
                    <span className="text-white">{formData.name || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-gray-400">Objet</span>
                    <span className="text-white">{formData.subject || "-"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-gray-400">Expéditeur</span>
                    <span className="text-white">{formData.fromName} &lt;{formData.fromEmail}&gt;</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-gray-400">Destinataires</span>
                    <span className="text-white font-medium">{getSelectedRecipientsCount().toLocaleString()} contacts</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Statut</span>
                    <span className={`px-2 py-0.5 rounded text-sm ${savedCampaignId ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {savedCampaignId ? "Sauvegardé" : "Non sauvegardé"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Sauvegarder comme brouillon
                </button>

                <button
                  onClick={handleSendCampaign}
                  disabled={loading || !formData.name || !formData.htmlContent}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 font-semibold"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  Envoyer la campagne
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </button>

            {step < 5 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
