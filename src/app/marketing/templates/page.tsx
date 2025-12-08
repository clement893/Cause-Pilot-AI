"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  X,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  htmlContent: string | null;
  textContent: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    campaigns: number;
  };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);

      const res = await fetch(`/api/marketing/templates?${params}`);
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

    try {
      const res = await fetch(`/api/marketing/templates/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const res = await fetch("/api/marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (copie)`,
          description: template.description,
          category: template.category,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
        }),
      });

      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error duplicating template:", error);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      WELCOME: "bg-green-500/20 text-green-400",
      THANK_YOU: "bg-blue-500/20 text-blue-400",
      NEWSLETTER: "bg-purple-500/20 text-purple-400",
      CAMPAIGN: "bg-pink-500/20 text-pink-400",
      REMINDER: "bg-yellow-500/20 text-yellow-400",
      REACTIVATION: "bg-orange-500/20 text-orange-400",
      RECEIPT: "bg-cyan-500/20 text-cyan-400",
      OTHER: "bg-gray-500/20 text-gray-400",
    };
    return colors[category] || colors.OTHER;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      WELCOME: "Bienvenue",
      THANK_YOU: "Remerciement",
      NEWSLETTER: "Newsletter",
      CAMPAIGN: "Campagne",
      REMINDER: "Rappel",
      REACTIVATION: "Réactivation",
      RECEIPT: "Reçu",
      OTHER: "Autre",
    };
    return labels[category] || category;
  };

  const breadcrumbs = [
    { name: "Marketing", href: "/marketing" },
    { name: "Templates", href: "/marketing/templates" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Templates Email</h1>
            <p className="text-gray-400 mt-1">
              Créez et gérez vos modèles email réutilisables
            </p>
          </div>
          <Link
            href="/marketing/templates/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouveau template
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
          >
            <option value="">Toutes les catégories</option>
            <option value="WELCOME">Bienvenue</option>
            <option value="THANK_YOU">Remerciement</option>
            <option value="NEWSLETTER">Newsletter</option>
            <option value="CAMPAIGN">Campagne</option>
            <option value="REMINDER">Rappel</option>
            <option value="REACTIVATION">Réactivation</option>
            <option value="RECEIPT">Reçu</option>
          </select>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
              >
                {/* Preview Area */}
                <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-500" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(template.category)}`}>
                          {getCategoryLabel(template.category)}
                        </span>
                        {template.isActive ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3 h-3" /> Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <X className="w-3 h-3" /> Inactif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mt-3">
                    Utilisé dans {template._count.campaigns} campagne(s)
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                    <Link
                      href={`/marketing/templates/${template.id}`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </Link>
                    <Link
                      href={`/marketing/templates/${template.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
            <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || categoryFilter
                ? "Aucun template ne correspond à vos critères"
                : "Commencez par créer votre premier template email"}
            </p>
            <Link
              href="/marketing/templates/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Créer un template
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
