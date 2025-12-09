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
  AlertTriangle,
  Users,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

interface DuplicateMatch {
  field: string;
  score: number;
  value1: string | null;
  value2: string | null;
}

interface DuplicateResult {
  index: number;
  newDonor: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  duplicates: Array<{
    existingDonor: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    };
    score: number;
    matches: DuplicateMatch[];
  }>;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = "upload" | "duplicates" | "result";

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [checkDuplicates, setCheckDuplicates] = useState(true);
  const [step, setStep] = useState<ImportStep>("upload");
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [duplicateActions, setDuplicateActions] = useState<Record<number, "skip" | "create" | "update">>({});
  const [expandedDuplicate, setExpandedDuplicate] = useState<number | null>(null);
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
        setStep("upload");
        setDuplicates([]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setResult(null);
        setStep("upload");
        setDuplicates([]);
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

  const checkForDuplicates = async () => {
    if (!file) return;

    setChecking(true);

    try {
      // D'abord, parser le fichier pour obtenir les données
      const formData = new FormData();
      formData.append("file", file);
      formData.append("parseOnly", "true");

      const parseResponse = await fetch("/api/donors/import", {
        method: "POST",
        body: formData,
      });

      const parseData = await parseResponse.json();

      if (!parseData.success || !parseData.donors) {
        // Pas de données à vérifier, passer directement à l'import
        await handleUpload();
        return;
      }

      // Vérifier les doublons
      const duplicateResponse = await fetch("/api/donors/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donors: parseData.donors, minScore: 50 }),
      });

      const duplicateData = await duplicateResponse.json();

      if (duplicateData.duplicatesFound > 0) {
        setDuplicates(duplicateData.results);
        // Initialiser les actions par défaut (ignorer)
        const defaultActions: Record<number, "skip" | "create" | "update"> = {};
        duplicateData.results.forEach((d: DuplicateResult) => {
          defaultActions[d.index] = "skip";
        });
        setDuplicateActions(defaultActions);
        setStep("duplicates");
      } else {
        // Pas de doublons, procéder à l'import
        await handleUpload();
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
      // En cas d'erreur, procéder à l'import normal
      await handleUpload();
    } finally {
      setChecking(false);
    }
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
      
      // Envoyer les actions pour les doublons
      if (Object.keys(duplicateActions).length > 0) {
        formData.append("duplicateActions", JSON.stringify(duplicateActions));
      }

      const response = await fetch("/api/donors/import", {
        method: "POST",
        body: formData,
      });

      const data: ImportResult = await response.json();
      setResult(data);
      setStep("result");

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
      setStep("result");
    } finally {
      setUploading(false);
    }
  };

  const handleStartImport = async () => {
    if (checkDuplicates) {
      await checkForDuplicates();
    } else {
      await handleUpload();
    }
  };

  const downloadTemplate = async (format: "csv" | "xlsx") => {
    window.location.href = `/api/donors/import?format=${format}`;
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setStep("upload");
    setDuplicates([]);
    setDuplicateActions({});
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-400 bg-red-500/20";
    if (score >= 60) return "text-orange-400 bg-orange-500/20";
    return "text-yellow-400 bg-yellow-500/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Très probable";
    if (score >= 60) return "Probable";
    return "Possible";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {step === "upload" && "Importer des donateurs"}
              {step === "duplicates" && "Doublons détectés"}
              {step === "result" && "Résultat de l'import"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {step === "upload" && "Importez vos donateurs depuis un fichier CSV ou Excel"}
              {step === "duplicates" && `${duplicates.length} doublon(s) potentiel(s) trouvé(s)`}
              {step === "result" && "Récapitulatif de l'importation"}
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
          {step === "upload" && (
            <>
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
                    checked={checkDuplicates}
                    onChange={(e) => setCheckDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500"
                  />
                  <div>
                    <span className="text-white">Vérifier les doublons avant l&apos;import</span>
                    <p className="text-xs text-gray-400">
                      Détecte les donateurs similaires déjà présents dans la base
                    </p>
                  </div>
                </label>

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
            </>
          )}

          {step === "duplicates" && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Doublons potentiels détectés</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Certains donateurs de votre fichier semblent déjà exister dans la base. 
                      Choisissez l&apos;action à effectuer pour chacun.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {duplicates.map((dup, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={() => setExpandedDuplicate(expandedDuplicate === idx ? null : idx)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-white font-medium">
                              {dup.newDonor.firstName} {dup.newDonor.lastName}
                            </p>
                            <p className="text-sm text-gray-400">{dup.newDonor.email || "Pas d'email"}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-white font-medium">
                              {dup.duplicates[0].existingDonor.firstName} {dup.duplicates[0].existingDonor.lastName}
                            </p>
                            <p className="text-sm text-gray-400">{dup.duplicates[0].existingDonor.email || "Pas d'email"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(dup.duplicates[0].score)}`}>
                            {dup.duplicates[0].score}% - {getScoreLabel(dup.duplicates[0].score)}
                          </span>
                          {expandedDuplicate === idx ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedDuplicate === idx && (
                      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                        <div className="mb-4">
                          <p className="text-sm text-gray-400 mb-2">Correspondances trouvées:</p>
                          <div className="flex flex-wrap gap-2">
                            {dup.duplicates[0].matches.map((match, mIdx) => (
                              <span key={mIdx} className="px-2 py-1 bg-slate-700 rounded text-xs text-gray-300">
                                {match.field}: {Math.round(match.score * 100)}%
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setDuplicateActions({ ...duplicateActions, [dup.index]: "skip" })}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              duplicateActions[dup.index] === "skip"
                                ? "bg-gray-500 text-white"
                                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                            }`}
                          >
                            Ignorer
                          </button>
                          <button
                            onClick={() => setDuplicateActions({ ...duplicateActions, [dup.index]: "update" })}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              duplicateActions[dup.index] === "update"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                            }`}
                          >
                            Mettre à jour
                          </button>
                          <button
                            onClick={() => setDuplicateActions({ ...duplicateActions, [dup.index]: "create" })}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              duplicateActions[dup.index] === "create"
                                ? "bg-green-500 text-white"
                                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                            }`}
                          >
                            Créer quand même
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="text-sm text-gray-400">
                  <span className="text-white font-medium">{Object.values(duplicateActions).filter(a => a === "skip").length}</span> ignoré(s) · 
                  <span className="text-white font-medium ml-1">{Object.values(duplicateActions).filter(a => a === "update").length}</span> mis à jour · 
                  <span className="text-white font-medium ml-1">{Object.values(duplicateActions).filter(a => a === "create").length}</span> créé(s)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const actions: Record<number, "skip" | "create" | "update"> = {};
                      duplicates.forEach(d => { actions[d.index] = "skip"; });
                      setDuplicateActions(actions);
                    }}
                    className="px-3 py-1 text-xs bg-slate-700 text-gray-300 rounded hover:bg-slate-600"
                  >
                    Tout ignorer
                  </button>
                  <button
                    onClick={() => {
                      const actions: Record<number, "skip" | "create" | "update"> = {};
                      duplicates.forEach(d => { actions[d.index] = "update"; });
                      setDuplicateActions(actions);
                    }}
                    className="px-3 py-1 text-xs bg-slate-700 text-gray-300 rounded hover:bg-slate-600"
                  >
                    Tout mettre à jour
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "result" && result && (
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
          {step === "upload" && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStartImport}
                disabled={!file || uploading || checking}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {checkDuplicates ? "Vérifier et importer" : "Importer"}
                  </>
                )}
              </button>
            </>
          )}

          {step === "duplicates" && (
            <>
              <button
                onClick={() => setStep("upload")}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
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
                    Continuer l&apos;import
                  </>
                )}
              </button>
            </>
          )}

          {step === "result" && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
