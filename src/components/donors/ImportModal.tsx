"use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
        setResult(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".csv", ".xls", ".xlsx"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    return validTypes.includes(file.type) || validExtensions.includes(extension);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("updateExisting", String(updateExisting));
      formData.append("skipErrors", String(skipErrors));

      const response = await fetch("/api/donors/import", {
        method: "POST",
        body: formData,
      });

      const data: ImportResult = await response.json();
      setResult(data);

      if (data.success && (data.created > 0 || data.updated > 0)) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setResult({
        success: false,
        message: "Erreur lors de l'upload du fichier",
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async (format: "csv" | "xlsx") => {
    window.location.href = `/api/donors/import?format=${format}`;
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Importer des donateurs</h2>
            <p className="text-sm text-gray-400 mt-1">
              Importez vos donateurs depuis un fichier CSV ou Excel
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-medium text-white mb-2">
              Télécharger un template
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Utilisez notre template pour vous assurer que vos données sont formatées correctement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => downloadTemplate("csv")}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Template CSV
              </button>
              <button
                onClick={() => downloadTemplate("xlsx")}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Template Excel
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? "border-pink-500 bg-pink-500/10"
                : file
                ? "border-green-500 bg-green-500/10"
                : "border-slate-600 hover:border-slate-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-green-400" />
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-white">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-sm text-gray-400">ou</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Parcourir
                </button>
                <p className="text-xs text-gray-500">
                  Formats acceptés: CSV, XLS, XLSX
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500"
              />
              <div>
                <span className="text-white">Mettre à jour les donateurs existants</span>
                <p className="text-xs text-gray-400">
                  Si un donateur avec le même email existe, ses informations seront mises à jour
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500"
              />
              <div>
                <span className="text-white">Ignorer les lignes avec erreurs</span>
                <p className="text-xs text-gray-400">
                  Continue l&apos;import même si certaines lignes contiennent des erreurs
                </p>
              </div>
            </label>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={result.success ? "text-green-400" : "text-red-400"}>
                    {result.message}
                  </p>
                  <div className="mt-2 text-sm text-gray-400">
                    <p>✓ {result.created} donateurs créés</p>
                    <p>↻ {result.updated} donateurs mis à jour</p>
                    <p>⊘ {result.skipped} lignes ignorées</p>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-red-400 mb-2">
                        Erreurs ({result.errors.length}):
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <p key={index} className="text-xs text-gray-400">
                            Ligne {error.row}: {error.message}
                          </p>
                        ))}
                        {result.errors.length > 10 && (
                          <p className="text-xs text-gray-500">
                            ... et {result.errors.length - 10} autres erreurs
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
