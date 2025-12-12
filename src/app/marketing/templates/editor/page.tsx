"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, FileText } from "lucide-react";
import Link from "next/link";
import { EmailEditor } from "@/components/email-editor";
import { EmailTemplate, EmailBlock } from "@/lib/email-editor/types";
import { STARTER_TEMPLATES } from "@/lib/email-editor/utils";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const starterId = searchParams.get("starter");
  
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      
      try {
        if (templateId) {
          // Charger un template existant
          const res = await fetch(`/api/marketing/templates/${templateId}`);
          if (res.ok) {
            const data = await res.json();
            setTemplate({
              id: data.id,
              name: data.name,
              description: data.description,
              category: data.category,
              blocks: data.blocks || [],
              globalStyle: data.globalStyle,
            });
            setTemplateName(data.name);
            setTemplateDescription(data.description || "");
          }
        } else if (starterId) {
          // Charger un template de démarrage
          const index = parseInt(starterId);
          const starter = STARTER_TEMPLATES[index];
          if (starter) {
            setTemplate({
              id: "",
              name: starter.name,
              description: starter.description,
              category: starter.category,
              blocks: starter.blocks as EmailBlock[],
              globalStyle: starter.globalStyle,
            });
            setTemplateName(starter.name + " (copie)");
            setTemplateDescription(starter.description || "");
            setShowNameModal(true);
          }
        } else {
          // Nouveau template vide
          setTemplate({
            id: "",
            name: "Nouveau template",
            blocks: [],
            globalStyle: {
              backgroundColor: "#ffffff",
              fontFamily: "Arial, sans-serif",
              contentWidth: "600px",
            },
          });
          setShowNameModal(true);
        }
      } catch (error) {
        console.error("Error loading template:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, starterId]);

  const handleSave = async (updatedTemplate: EmailTemplate) => {
    setSaving(true);
    
    try {
      const payload = {
        name: templateName || updatedTemplate.name,
        description: templateDescription,
        category: updatedTemplate.category || "GENERAL",
        blocks: updatedTemplate.blocks,
        globalStyle: updatedTemplate.globalStyle,
      };

      let res;
      if (templateId && !templateId.startsWith("starter-")) {
        // Mise à jour
        res = await fetch(`/api/marketing/templates/${templateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Création
        res = await fetch("/api/marketing/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        if (!templateId) {
          router.push(`/marketing/templates/editor?id=${saved.id}`);
        }
        alert("Template sauvegardé avec succès !");
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = (html: string) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName || "template"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/marketing/templates"
            className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="bg-transparent border-none text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
              placeholder="Nom du template"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {saving ? "Sauvegarde..." : ""}
          </span>
        </div>
      </div>

      {/* Éditeur */}
      <div className="flex-1 overflow-hidden">
        {template && (
          <EmailEditor
            initialTemplate={template}
            onSave={handleSave}
            onExport={handleExport}
          />
        )}
      </div>

      {/* Modal pour le nom du template */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              Nouveau template
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Nom du template
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder="Ex: Newsletter mensuelle"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white min-h-[80px]"
                  placeholder="Description du template..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => router.push("/marketing/templates")}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowNameModal(false)}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
