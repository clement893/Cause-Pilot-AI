"use client";

import { useState } from "react";
import {
  X,
  Mail,
  Tag,
  Users,
  Download,
  Trash2,
  ChevronDown,
  CheckCircle,
  Loader2,
  ListPlus,
} from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onActionComplete: () => void;
}

const SEGMENTS = ["PROSPECT", "NEW", "ACTIVE", "LAPSED", "MAJOR", "VIP"];
const STATUSES = ["ACTIVE", "INACTIVE", "LAPSED", "ARCHIVED"];

export default function BulkActionsBar({
  selectedCount,
  selectedIds,
  onClear,
  onActionComplete,
}: BulkActionsBarProps) {
  const [loading, setLoading] = useState(false);
  const [showSegmentMenu, setShowSegmentMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const executeAction = async (action: string, params: Record<string, unknown> = {}) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/donors/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          donorIds: selectedIds,
          params,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult({ success: true, message: data.message });
        
        // Pour l'export, télécharger le fichier
        if (action === "export" && data.data) {
          downloadCSV(data.data);
        }
        
        // Rafraîchir après un délai
        setTimeout(() => {
          onActionComplete();
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || "Erreur" });
      }
    } catch (error) {
      setResult({ success: false, message: "Erreur de connexion" });
    } finally {
      setLoading(false);
      setShowSegmentMenu(false);
      setShowTagMenu(false);
      setShowStatusMenu(false);
    }
  };

  const downloadCSV = (data: Record<string, unknown>[]) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return String(value);
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `donateurs_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      executeAction("add_tag", { tag: newTag.trim() });
      setNewTag("");
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ml-32 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 flex items-center gap-4">
        {/* Compteur */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">{selectedCount}</p>
            <p className="text-xs text-gray-400">sélectionné(s)</p>
          </div>
        </div>

        {/* Actions */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Traitement...</span>
          </div>
        ) : result ? (
          <div className={`flex items-center gap-2 ${result.success ? "text-green-400" : "text-red-400"}`}>
            <CheckCircle className="w-5 h-5" />
            <span>{result.message}</span>
          </div>
        ) : (
          <>
            {/* Changer le segment */}
            <div className="relative">
              <button
                onClick={() => setShowSegmentMenu(!showSegmentMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Segment
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSegmentMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  {SEGMENTS.map((segment) => (
                    <button
                      key={segment}
                      onClick={() => executeAction("update_segment", { segment })}
                      className="block w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-700 transition-colors"
                    >
                      {segment}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Changer le statut */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Statut
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => executeAction("update_status", { status })}
                      className="block w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-700 transition-colors"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ajouter un tag */}
            <div className="relative">
              <button
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
              >
                <Tag className="w-4 h-4" />
                Tag
                <ChevronDown className="w-4 h-4" />
              </button>
              {showTagMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 w-64">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nom du tag..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Ajouter le tag
                  </button>
                </div>
              )}
            </div>

            {/* Créer une campagne email */}
            <button
              onClick={() => executeAction("create_email_campaign", { 
                name: `Campagne - ${selectedCount} donateurs`,
                subject: "Nouvelle communication",
              })}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>

            {/* Exporter */}
            <button
              onClick={() => executeAction("export")}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>

            {/* Archiver */}
            <button
              onClick={() => {
                if (confirm(`Êtes-vous sûr de vouloir archiver ${selectedCount} donateur(s) ?`)) {
                  executeAction("delete");
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Fermer */}
        <button
          onClick={onClear}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
