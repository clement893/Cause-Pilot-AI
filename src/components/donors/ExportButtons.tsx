"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

interface ExportButtonsProps {
  filters?: {
    status?: string;
    segment?: string;
    tags?: string;
    search?: string;
  };
  selectedIds?: string[];
}

export function ExportButtons({ filters, selectedIds }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format: "csv" | "xlsx") => {
    setExporting(format);
    setShowDropdown(false);

    try {
      const params = new URLSearchParams();
      params.set("format", format);

      if (selectedIds && selectedIds.length > 0) {
        params.set("ids", selectedIds.join(","));
      } else {
        if (filters?.status) params.set("status", filters.status);
        if (filters?.segment) params.set("segment", filters.segment);
        if (filters?.tags) params.set("tags", filters.tags);
        if (filters?.search) params.set("search", filters.search);
      }

      // Télécharger le fichier
      const response = await fetch(`/api/donors/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donateurs_export_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Erreur lors de l'export des donateurs");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={exporting !== null}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-50"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Exporter
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors"
            >
              <FileText className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium">Export CSV</p>
                <p className="text-xs text-gray-400">Format texte universel</p>
              </div>
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors border-t border-slate-700"
            >
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium">Export Excel</p>
                <p className="text-xs text-gray-400">Format .xlsx</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
