"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Merge,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface DuplicateMatch {
  field: string;
  score: number;
  value1: string | null;
  value2: string | null;
}

interface DonorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  createdAt: string;
}

interface DuplicateGroup {
  donors: DonorSummary[];
  score: number;
  matches: DuplicateMatch[];
}

export default function DuplicatesPage() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [totalDonors, setTotalDonors] = useState(0);
  const [minScore, setMinScore] = useState(50);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [merging, setMerging] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const scanForDuplicates = async () => {
    setScanning(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/donors/duplicates?scanAll=true&minScore=${minScore}`);
      const data = await response.json();

      if (data.error) {
        setMessage({ type: "error", text: data.error });
      } else {
        setDuplicateGroups(data.duplicateGroups || []);
        setTotalDonors(data.totalDonors || 0);
      }
    } catch (error) {
      console.error("Error scanning duplicates:", error);
      setMessage({ type: "error", text: "Erreur lors du scan des doublons" });
    } finally {
      setScanning(false);
    }
  };

  const handleMerge = async (keepDonorId: string, mergeDonorId: string) => {
    setMerging(keepDonorId + mergeDonorId);
    setMessage(null);

    try {
      const response = await fetch("/api/donors/duplicates/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepDonorId, mergeDonorId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Donateurs fusionnés avec succès" });
        // Retirer le groupe fusionné de la liste
        setDuplicateGroups(groups => 
          groups.filter(g => 
            !(g.donors.some(d => d.id === keepDonorId) && g.donors.some(d => d.id === mergeDonorId))
          )
        );
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la fusion" });
      }
    } catch (error) {
      console.error("Error merging donors:", error);
      setMessage({ type: "error", text: "Erreur lors de la fusion des donateurs" });
    } finally {
      setMerging(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-400 bg-red-500/20 border-red-500/30";
    if (score >= 60) return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Très probable";
    if (score >= 60) return "Probable";
    return "Possible";
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      email: "Email",
      firstName: "Prénom",
      lastName: "Nom",
      phone: "Téléphone",
      address: "Adresse",
      postalCode: "Code postal",
    };
    return labels[field] || field;
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Gestion des doublons</h1>
              <p className="text-gray-400 mt-1">
                Détectez et fusionnez les donateurs en double dans votre base
              </p>
            </div>
            <Link
              href="/donors"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Retour aux donateurs
            </Link>
          </div>

          {/* Scan Controls */}
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Score minimum de similarité
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="10"
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-white font-medium w-16 text-center">{minScore}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Plus le score est élevé, plus les doublons sont probables
                </p>
              </div>
              <button
                onClick={scanForDuplicates}
                disabled={scanning}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scan en cours...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Scanner la base
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg border mb-6 ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                {message.text}
              </div>
            </div>
          )}

          {/* Results */}
          {duplicateGroups.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">
                  <span className="text-white font-medium">{duplicateGroups.length}</span> groupe(s) de doublons trouvé(s) sur{" "}
                  <span className="text-white font-medium">{totalDonors}</span> donateurs
                </p>
                <button
                  onClick={scanForDuplicates}
                  disabled={scanning}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
                  Actualiser
                </button>
              </div>

              {duplicateGroups.map((group, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => setExpandedGroup(expandedGroup === idx ? null : idx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-white font-medium">
                              {group.donors[0].firstName} {group.donors[0].lastName}
                            </p>
                            <p className="text-sm text-gray-400">{group.donors[0].email || "Pas d'email"}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-white font-medium">
                              {group.donors[1].firstName} {group.donors[1].lastName}
                            </p>
                            <p className="text-sm text-gray-400">{group.donors[1].email || "Pas d'email"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getScoreColor(group.score)}`}>
                          {group.score}% - {getScoreLabel(group.score)}
                        </span>
                        {expandedGroup === idx ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedGroup === idx && (
                    <div className="border-t border-slate-700">
                      {/* Matches */}
                      <div className="p-4 bg-slate-800/30">
                        <p className="text-sm text-gray-400 mb-3">Correspondances trouvées:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {group.matches.map((match, mIdx) => (
                            <div key={mIdx} className="p-3 bg-slate-800 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">{getFieldLabel(match.field)}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-white truncate flex-1">{match.value1 || "-"}</p>
                                <span className="mx-2 text-gray-500">=</span>
                                <p className="text-sm text-white truncate flex-1">{match.value2 || "-"}</p>
                              </div>
                              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
                                  style={{ width: `${match.score * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comparison */}
                      <div className="p-4">
                        <p className="text-sm text-gray-400 mb-3">Comparaison détaillée:</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          {group.donors.map((donor, dIdx) => (
                            <div key={donor.id} className="p-4 bg-slate-800 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-500">
                                  {dIdx === 0 ? "Donateur A" : "Donateur B"}
                                </span>
                                <Link
                                  href={`/donors/${donor.id}`}
                                  className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Voir
                                </Link>
                              </div>
                              <p className="text-white font-medium">{donor.firstName} {donor.lastName}</p>
                              <p className="text-sm text-gray-400">{donor.email || "Pas d'email"}</p>
                              <p className="text-sm text-gray-400">{donor.phone || "Pas de téléphone"}</p>
                              <p className="text-sm text-gray-400">{donor.city || "Pas de ville"}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Créé le {new Date(donor.createdAt).toLocaleDateString("fr-CA")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleMerge(group.donors[0].id, group.donors[1].id)}
                            disabled={merging === group.donors[0].id + group.donors[1].id}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {merging === group.donors[0].id + group.donors[1].id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Merge className="w-4 h-4" />
                            )}
                            Garder A, fusionner B
                          </button>
                          <button
                            onClick={() => handleMerge(group.donors[1].id, group.donors[0].id)}
                            disabled={merging === group.donors[1].id + group.donors[0].id}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {merging === group.donors[1].id + group.donors[0].id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Merge className="w-4 h-4" />
                            )}
                            Garder B, fusionner A
                          </button>
                          <button
                            onClick={() => setExpandedGroup(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            Ignorer
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          La fusion transfère tous les dons et l&apos;historique vers le donateur conservé, puis supprime le doublon.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !scanning && (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Aucun doublon détecté</h3>
              <p className="text-gray-400 mb-6">
                Cliquez sur &quot;Scanner la base&quot; pour rechercher des doublons potentiels dans votre base de donateurs.
              </p>
              <button
                onClick={scanForDuplicates}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                <Search className="w-4 h-4" />
                Lancer le scan
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
