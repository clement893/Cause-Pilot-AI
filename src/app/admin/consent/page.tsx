"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Shield,
  Download,
  RefreshCw,
  Mail,
  Phone,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ConsentReport {
  generatedAt: string;
  summary: {
    totalDonors: number;
    consentEmail: number;
    consentPhone: number;
    consentMail: number;
    noConsent: number;
    allConsent: number;
    recentOptOuts: number;
    rates: {
      email: string;
      phone: string;
      mail: string;
    };
  };
  changesBySource: Array<{ source: string; count: number }>;
  recentChanges: Array<{
    id: string;
    donorName: string;
    donorEmail: string | null;
    consentType: string;
    previousValue: Record<string, boolean> | null;
    newValue: Record<string, boolean>;
    source: string;
    reason: string | null;
    createdAt: string;
    ipAddress: string | null;
  }>;
}

export default function ConsentReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ConsentReport | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/consent-report";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportCSV = () => {
    let url = "/api/admin/consent-report?format=csv";
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.location.href = url;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      admin: "Administration",
      preference_center: "Centre de préférences",
      email_link: "Lien email",
      import: "Import",
      api: "API",
    };
    return labels[source] || source;
  };

  const getConsentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      update: "Mise à jour",
      opt_in: "Inscription",
      opt_out: "Désinscription",
      initial: "Initial",
    };
    return labels[type] || type;
  };

  const getConsentTypeColor = (type: string) => {
    switch (type) {
      case "opt_in":
        return "text-success-light bg-success/20";
      case "opt_out":
        return "text-error-light bg-error/20";
      default:
        return "text-info-light bg-info/20";
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Shield className="w-7 h-7 text-accent" />
                Rapport des Consentements RGPD
              </h1>
              <p className="text-muted-foreground mt-1">
                Suivi et audit des consentements pour la conformité légale
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-surface-secondary text-white rounded-lg hover:bg-surface-tertiary transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>

          {/* Filtres de date */}
          <div className="bg-surface-primary rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-surface-secondary border border-border rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-surface-secondary border border-border rounded-lg text-white"
                />
              </div>
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-surface-tertiary text-white rounded-lg hover:bg-surface-elevated"
              >
                Filtrer
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    fetchReport();
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-white"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : report ? (
            <>
              {/* Statistiques globales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-info-light" />
                    <span className="text-2xl font-bold text-white">
                      {report.summary.totalDonors}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Total donateurs</p>
                </div>

                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Mail className="w-8 h-8 text-success-light" />
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {report.summary.consentEmail}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({report.summary.rates.email}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">Consentement Email</p>
                </div>

                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Phone className="w-8 h-8 text-brand-light" />
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {report.summary.consentPhone}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({report.summary.rates.phone}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">Consentement Téléphone</p>
                </div>

                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-8 h-8 text-orange-400" />
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {report.summary.consentMail}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({report.summary.rates.mail}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">Consentement Courrier</p>
                </div>
              </div>

              {/* Alertes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-success-light" />
                    <span className="text-white font-medium">Tous consentements</span>
                  </div>
                  <p className="text-3xl font-bold text-success-light">
                    {report.summary.allConsent}
                  </p>
                  <p className="text-sm text-muted-foreground">donateurs avec tous les consentements</p>
                </div>

                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-medium">Aucun consentement</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">
                    {report.summary.noConsent}
                  </p>
                  <p className="text-sm text-muted-foreground">donateurs sans consentement</p>
                </div>

                <div className="bg-surface-primary rounded-xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-5 h-5 text-error-light" />
                    <span className="text-white font-medium">Opt-outs récents</span>
                  </div>
                  <p className="text-3xl font-bold text-error-light">
                    {report.summary.recentOptOuts}
                  </p>
                  <p className="text-sm text-muted-foreground">désinscriptions (30 derniers jours)</p>
                </div>
              </div>

              {/* Changements par source */}
              {report.changesBySource.length > 0 && (
                <div className="bg-surface-primary rounded-xl border border-border p-6 mb-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Changements par source
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {report.changesBySource.map((source) => (
                      <div
                        key={source.source}
                        className="p-4 bg-surface-secondary rounded-lg text-center"
                      >
                        <p className="text-2xl font-bold text-white">{source.count}</p>
                        <p className="text-sm text-muted-foreground">{getSourceLabel(source.source)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique des changements */}
              <div className="bg-surface-primary rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-semibold text-white">
                    Historique des changements
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    100 derniers changements de consentement
                  </p>
                </div>

                {report.recentChanges.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Donateur
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Source
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Changements
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            IP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {report.recentChanges.map((change) => (
                          <tr key={change.id} className="hover:bg-surface-secondary/50">
                            <td className="px-4 py-3 text-sm text-foreground">
                              {new Date(change.createdAt).toLocaleString("fr-CA")}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-white">{change.donorName}</p>
                              <p className="text-xs text-muted-foreground">{change.donorEmail}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getConsentTypeColor(
                                  change.consentType
                                )}`}
                              >
                                {getConsentTypeLabel(change.consentType)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {getSourceLabel(change.source)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 text-xs">
                                {change.newValue.consentEmail !== change.previousValue?.consentEmail && (
                                  <span className={change.newValue.consentEmail ? "text-success-light" : "text-error-light"}>
                                    Email: {change.newValue.consentEmail ? "✓" : "✗"}
                                  </span>
                                )}
                                {change.newValue.consentPhone !== change.previousValue?.consentPhone && (
                                  <span className={change.newValue.consentPhone ? "text-success-light" : "text-error-light"}>
                                    Tél: {change.newValue.consentPhone ? "✓" : "✗"}
                                  </span>
                                )}
                                {change.newValue.consentMail !== change.previousValue?.consentMail && (
                                  <span className={change.newValue.consentMail ? "text-success-light" : "text-error-light"}>
                                    Courrier: {change.newValue.consentMail ? "✓" : "✗"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {change.ipAddress || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun changement de consentement enregistré</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-surface-primary rounded-xl border border-border p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <p className="text-white">Erreur lors du chargement du rapport</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
