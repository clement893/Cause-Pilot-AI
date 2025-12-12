"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Send, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  RefreshCw,
  Mail,
  Plus,
  X
} from "lucide-react";
import { Button, Card, Badge, Input, Textarea, Select, Modal } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface ReportData {
  metadata: {
    type: string;
    period: string;
    generatedAt: string;
    year: number;
    month?: number;
  };
  summary: {
    totalRaised: number;
    totalDonations: number;
    totalDonors: number;
    newDonors: number;
    averageDonation: number;
    retentionRate: number;
  };
  donationMetrics: {
    totalAmount: number;
    donationCount: number;
    averageDonation: number;
    recurringAmount: number;
    oneTimeAmount: number;
    largestDonation: number;
  };
  donorMetrics: {
    totalDonors: number;
    newDonors: number;
    returningDonors: number;
    lapsedDonors: number;
    retentionRate: number;
    averageLifetimeValue: number;
  };
  campaignMetrics: {
    activeCampaigns: number;
    completedCampaigns: number;
    totalRaised: number;
    averageGoalCompletion: number;
    topCampaigns: Array<{
      name: string;
      raised: number;
      goal: number;
      percentage: number;
    }>;
  };
  yearOverYear: {
    currentPeriod: { totalAmount: number; donationCount: number };
    previousPeriod: { totalAmount: number; donationCount: number };
    growthRate: number;
    donorGrowthRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    monthNumber: number;
    amount: number;
    count: number;
    previousYearAmount: number;
  }>;
  topDonors: Array<{
    name: string;
    email: string;
    totalAmount: number;
    donationCount: number;
  }>;
  sourceBreakdown: Array<{
    source: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  highlights: string[];
  recommendations: string[];
}

interface Recipient {
  name: string;
  email: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "", email: "" }
  ]);
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const monthOptions = [
    { value: "1", label: "Janvier" },
    { value: "2", label: "Février" },
    { value: "3", label: "Mars" },
    { value: "4", label: "Avril" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" },
    { value: "8", label: "Août" },
    { value: "9", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: (new Date().getFullYear() - i).toString(),
  }));

  const reportTypeOptions = [
    { value: "monthly", label: "Mensuel" },
    { value: "quarterly", label: "Trimestriel" },
    { value: "annual", label: "Annuel" },
  ];

  useEffect(() => {
    generateReport();
  }, [reportType, year, month]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        year: year.toString(),
        month: month.toString(),
      });
      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("error", "Impossible de générer le rapport");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        year: year.toString(),
        month: month.toString(),
      });
      const response = await fetch(`/api/reports/pdf?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-ca-${reportType}-${year}${reportType === "monthly" ? `-${month}` : ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification("success", "Le rapport PDF a été téléchargé");
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("error", "Impossible de télécharger le PDF");
    }
  };

  const sendReport = async () => {
    const validRecipients = recipients.filter(r => r.email.trim() !== "");
    if (validRecipients.length === 0) {
      showNotification("error", "Veuillez ajouter au moins un destinataire");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          year,
          month,
          recipients: validRecipients,
          message: emailMessage,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        showNotification("success", data.message);
        setSendDialogOpen(false);
        setRecipients([{ name: "", email: "" }]);
        setEmailMessage("");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erreur:", error);
      showNotification("error", "Impossible d'envoyer le rapport");
    } finally {
      setSending(false);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: "", email: "" }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: "name" | "email", value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number, showSign = true) => {
    const sign = showSign && value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "trends", label: "Tendances" },
    { id: "donors", label: "Donateurs" },
    { id: "campaigns", label: "Campagnes" },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success" ? "bg-success/20/90 text-green-100" : "bg-error/20/90 text-red-100"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Rapports pour le CA</h1>
            <p className="text-muted-foreground mt-1">
              Générez et partagez des rapports professionnels pour votre Conseil d&apos;Administration
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadPDF} disabled={loading || !report}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button onClick={() => setSendDialogOpen(true)} disabled={loading || !report}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer au CA
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className="mb-6" variant="dark">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Select
                label="Type de rapport"
                options={reportTypeOptions}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                variant="dark"
              />
            </div>
            <div className="w-32">
              <Select
                label="Année"
                options={yearOptions}
                value={year.toString()}
                onChange={(e) => setYear(parseInt(e.target.value))}
                variant="dark"
              />
            </div>
            {reportType === "monthly" && (
              <div className="w-40">
                <Select
                  label="Mois"
                  options={monthOptions}
                  value={month.toString()}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  variant="dark"
                />
              </div>
            )}
            <Button variant="outline" onClick={generateReport} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : report && report.summary && report.yearOverYear ? (
          <>
            {/* Résumé Exécutif */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card variant="dark">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Collecté</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(report.summary?.totalRaised || 0)}</p>
                    <p className={`text-sm ${(report.yearOverYear?.growthRate || 0) >= 0 ? "text-success-light" : "text-error-light"}`}>
                      {(report.yearOverYear?.growthRate || 0) >= 0 ? <TrendingUp className="inline h-4 w-4" /> : <TrendingDown className="inline h-4 w-4" />}
                      {" "}{formatPercent(report.yearOverYear?.growthRate || 0)} vs N-1
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-900/50 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>
              </Card>
              <Card variant="dark">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre de Dons</p>
                    <p className="text-2xl font-bold text-white">{report.summary.totalDonations}</p>
                    <p className={`text-sm ${report.yearOverYear.donorGrowthRate >= 0 ? "text-success-light" : "text-error-light"}`}>
                      {formatPercent(report.yearOverYear.donorGrowthRate)} vs N-1
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-success/20/50 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-success-light" />
                  </div>
                </div>
              </Card>
              <Card variant="dark">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Donateurs Actifs</p>
                    <p className="text-2xl font-bold text-white">{report.summary.totalDonors}</p>
                    <p className="text-sm text-muted-foreground">
                      dont {report.summary.newDonors} nouveaux
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-900/50 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-brand-light" />
                  </div>
                </div>
              </Card>
              <Card variant="dark">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de Rétention</p>
                    <p className="text-2xl font-bold text-white">{report.summary.retentionRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">
                      Don moyen: {formatCurrency(report.summary.averageDonation)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-900/50 rounded-full flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex gap-2 border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-indigo-400 border-b-2 border-indigo-400"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Points Saillants */}
                  <Card variant="dark">
                    <h3 className="text-lg font-semibold mb-4 text-white">Points Saillants</h3>
                    <div className="space-y-3">
                      {report.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-indigo-900/30 rounded-lg border-l-4 border-indigo-500">
                          <p className="text-indigo-200">{highlight}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Recommandations */}
                  <Card variant="dark">
                    <h3 className="text-lg font-semibold mb-4 text-white">Recommandations</h3>
                    <div className="space-y-3">
                      {report.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-warning/20/30 rounded-lg border-l-4 border-amber-500">
                          <p className="text-amber-200">• {rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Comparaison Y/Y */}
                <Card variant="dark">
                  <h3 className="text-lg font-semibold mb-4 text-white">Comparaison Année sur Année</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Métrique</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">{year}</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">{year - 1}</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Variation</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-white">Total Collecté</td>
                          <td className="text-right py-3 px-4 font-medium text-white">{formatCurrency(report.yearOverYear.currentPeriod.totalAmount)}</td>
                          <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(report.yearOverYear.previousPeriod.totalAmount)}</td>
                          <td className={`text-right py-3 px-4 font-medium ${report.yearOverYear.growthRate >= 0 ? "text-success-light" : "text-error-light"}`}>
                            {formatPercent(report.yearOverYear.growthRate)}
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-white">Nombre de Dons</td>
                          <td className="text-right py-3 px-4 font-medium text-white">{report.yearOverYear.currentPeriod.donationCount}</td>
                          <td className="text-right py-3 px-4 text-muted-foreground">{report.yearOverYear.previousPeriod.donationCount}</td>
                          <td className={`text-right py-3 px-4 font-medium ${report.yearOverYear.donorGrowthRate >= 0 ? "text-success-light" : "text-error-light"}`}>
                            {formatPercent(report.yearOverYear.donorGrowthRate)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "trends" && (
              <Card variant="dark">
                <h3 className="text-lg font-semibold mb-4 text-white">Évolution Mensuelle</h3>
                <p className="text-muted-foreground text-sm mb-4">Comparaison des montants collectés par mois</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mois</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">{year}</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">{year - 1}</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Nb Dons</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.monthlyTrends.map((trend, index) => {
                        const maxAmount = Math.max(...report.monthlyTrends.map(t => t.amount));
                        const percentage = maxAmount > 0 ? (trend.amount / maxAmount) * 100 : 0;
                        return (
                          <tr key={index} className="border-b border-border">
                            <td className="py-3 px-4 text-white">{trend.month}</td>
                            <td className="text-right py-3 px-4 font-medium text-white">{formatCurrency(trend.amount)}</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(trend.previousYearAmount)}</td>
                            <td className="text-right py-3 px-4 text-white">{trend.count}</td>
                            <td className="py-3 px-4">
                              <div className="w-full bg-surface-tertiary rounded-full h-2">
                                <div 
                                  className="bg-indigo-500 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === "donors" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card variant="dark">
                  <h3 className="text-lg font-semibold mb-4 text-white">Santé de la Base Donateurs</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Donateurs actifs</span>
                      <span className="font-bold text-white">{report.donorMetrics.totalDonors}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Nouveaux donateurs</span>
                      <span className="font-bold text-success-light">{report.donorMetrics.newDonors}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Donateurs fidèles</span>
                      <span className="font-bold text-white">{report.donorMetrics.returningDonors}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Donateurs inactifs</span>
                      <span className="font-bold text-error-light">{report.donorMetrics.lapsedDonors}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Taux de rétention</span>
                      <Badge variant={report.donorMetrics.retentionRate >= 50 ? "success" : "warning"}>
                        {report.donorMetrics.retentionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Valeur vie moyenne</span>
                      <span className="font-bold text-white">{formatCurrency(report.donorMetrics.averageLifetimeValue)}</span>
                    </div>
                  </div>
                </Card>

                <Card variant="dark">
                  <h3 className="text-lg font-semibold mb-4 text-white">Top 10 Donateurs</h3>
                  <div className="space-y-3">
                    {report.topDonors.map((donor, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{donor.name}</p>
                            <p className="text-sm text-muted-foreground">{donor.donationCount} don(s)</p>
                          </div>
                        </div>
                        <span className="font-bold text-white">{formatCurrency(donor.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "campaigns" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <Card variant="dark">
                    <p className="text-sm text-muted-foreground">Campagnes Actives</p>
                    <p className="text-3xl font-bold text-white">{report.campaignMetrics.activeCampaigns}</p>
                  </Card>
                  <Card variant="dark">
                    <p className="text-sm text-muted-foreground">Campagnes Terminées</p>
                    <p className="text-3xl font-bold text-white">{report.campaignMetrics.completedCampaigns}</p>
                  </Card>
                  <Card variant="dark">
                    <p className="text-sm text-muted-foreground">Atteinte Moyenne des Objectifs</p>
                    <p className="text-3xl font-bold text-white">{report.campaignMetrics.averageGoalCompletion.toFixed(0)}%</p>
                  </Card>
                </div>

                <Card variant="dark">
                  <h3 className="text-lg font-semibold mb-4 text-white">Top Campagnes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Campagne</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Collecté</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Objectif</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progression</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.campaignMetrics.topCampaigns.map((campaign, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="py-3 px-4 font-medium text-white">{campaign.name}</td>
                            <td className="text-right py-3 px-4 text-white">{formatCurrency(campaign.raised)}</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(campaign.goal)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-surface-tertiary rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${campaign.percentage >= 100 ? "bg-success" : "bg-indigo-500"}`}
                                    style={{ width: `${Math.min(campaign.percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12 text-right text-white">
                                  {campaign.percentage.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </>
        ) : (
          <Card variant="dark" className="py-20 text-center">
            <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-muted-foreground">Sélectionnez une période pour générer un rapport</p>
          </Card>
        )}

        {/* Modal d'envoi */}
        <Modal
          isOpen={sendDialogOpen}
          onClose={() => setSendDialogOpen(false)}
          title="Envoyer le rapport au CA"
          size="lg"
          variant="dark"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Le rapport sera envoyé par email avec le PDF en pièce jointe.
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Destinataires</label>
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Nom"
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, "name", e.target.value)}
                    variant="dark"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, "email", e.target.value)}
                    variant="dark"
                  />
                  {recipients.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => removeRecipient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRecipient}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un destinataire
              </Button>
            </div>
            
            <div>
              <Textarea
                label="Message personnalisé (optionnel)"
                placeholder="Ajoutez un message pour accompagner le rapport..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
                variant="dark"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={sendReport} disabled={sending} loading={sending}>
              <Mail className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
