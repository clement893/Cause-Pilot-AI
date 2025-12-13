"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Badge, Spinner } from "@/components/ui";

interface TaxReceipt {
  id: string;
  receiptNumber: string;
  year: number;
  amount: number;
  donationDate: string;
  issueDate: string;
  status: string;
  sentAt: string | null;
  sentTo: string | null;
  receiptType: string;
  country: string;
  pdfUrl: string | null;
  Donation: {
    id: string;
    campaignName: string | null;
    paymentMethod: string;
  };
}

interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DonorReceiptsPageProps {
  params: Promise<{ id: string }>;
}

export default function DonorReceiptsPage({ params }: DonorReceiptsPageProps) {
  const { id } = use(params);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [receipts, setReceipts] = useState<TaxReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch donor info
      const donorRes = await fetch(`/api/donors/${id}`);
      const donorData = await donorRes.json();
      if (donorData.success) {
        setDonor(donorData.data);
      }

      // Fetch receipts
      const receiptsRes = await fetch(`/api/receipts?donorId=${id}`);
      const receiptsData = await receiptsRes.json();
      if (receiptsData.receipts) {
        setReceipts(receiptsData.receipts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDownloadReceipt = async (receiptId: string) => {
    window.open(`/api/receipts/${receiptId}/pdf`, "_blank");
  };

  const handleSendReceipt = async (receiptId: string) => {
    setSendingReceipt(receiptId);
    try {
      const res = await fetch(`/api/receipts/${receiptId}/send`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        alert("Reçu envoyé avec succès!");
        fetchData();
      } else {
        alert("Erreur lors de l'envoi du reçu: " + data.error);
      }
    } catch (error) {
      console.error("Error sending receipt:", error);
      alert("Erreur lors de l'envoi du reçu");
    } finally {
      setSendingReceipt(null);
    }
  };

  const handleVoidReceipt = async (receiptId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler ce reçu ?")) return;

    try {
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void", reason: "Annulé par l'utilisateur" }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Reçu annulé avec succès");
        fetchData();
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error voiding receipt:", error);
      alert("Erreur lors de l'annulation");
    }
  };

  const handleGenerateMissingReceipts = async () => {
    setGeneratingReceipt(true);
    try {
      // Fetch donations without receipts
      const donationsRes = await fetch(`/api/donors/${id}/donations`);
      const donationsData = await donationsRes.json();

      if (!donationsData.success) {
        alert("Erreur lors de la récupération des dons");
        return;
      }

      const completedDonations = donationsData.data.filter(
        (d: { status: string }) => d.status === "COMPLETED"
      );
      const receiptDonationIds = new Set(receipts.map((r) => r.donation.id));
      const donationsWithoutReceipts = completedDonations.filter(
        (d: { id: string }) => !receiptDonationIds.has(d.id)
      );

      if (donationsWithoutReceipts.length === 0) {
        alert("Tous les dons ont déjà un reçu fiscal");
        return;
      }

      let generated = 0;
      for (const donation of donationsWithoutReceipts) {
        const res = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId: donation.id, sendEmail: false }),
        });
        const data = await res.json();
        if (data.success) generated++;
      }

      alert(`${generated} reçu(s) généré(s) avec succès`);
      fetchData();
    } catch (error) {
      console.error("Error generating receipts:", error);
      alert("Erreur lors de la génération des reçus");
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const formatCurrency = (amount: number, country: string = "CA") => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: country === "FR" ? "EUR" : "CAD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <Badge variant="success">Envoyé</Badge>;
      case "DOWNLOADED":
        return <Badge variant="info">Téléchargé</Badge>;
      case "VOIDED":
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="warning">Généré</Badge>;
    }
  };

  const getReceiptTypeBadge = (type: string) => {
    switch (type) {
      case "ANNUAL":
        return <Badge variant="info">Annuel</Badge>;
      case "REPLACEMENT":
        return <Badge variant="warning">Remplacement</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!donor) {
    return (
      <AppLayout breadcrumbs={[{ name: "Base Donateurs", href: "/donors" }, { name: "Erreur" }]}>
        <Card className="text-center max-w-md mx-auto bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-white">Donateur non trouvé</h3>
          <div className="mt-4">
            <Link href="/donors">
              <Button variant="primary">Retour à la liste</Button>
            </Link>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const activeReceipts = receipts.filter((r) => r.status !== "VOIDED");
  const voidedReceipts = receipts.filter((r) => r.status === "VOIDED");
  const totalAmount = activeReceipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <AppLayout
      breadcrumbs={[
        { name: "Base Donateurs", href: "/donors" },
        { name: `${donor.firstName} ${donor.lastName}`, href: `/donors/${id}` },
        { name: "Reçus fiscaux" },
      ]}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Reçus fiscaux - {donor.firstName} {donor.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Gérez et envoyez les reçus fiscaux pour ce donateur
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateMissingReceipts}
              disabled={generatingReceipt}
            >
              {generatingReceipt ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Générer les reçus manquants
            </Button>
            <Link href={`/donors/${id}`}>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour au profil
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total des reçus</p>
              <p className="text-2xl font-bold text-white">{activeReceipts.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Montant total</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Envoyés par email</p>
              <p className="text-2xl font-bold text-white">
                {activeReceipts.filter((r) => r.status === "SENT").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Receipts List */}
      <Card className="bg-slate-900 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Reçus fiscaux ({activeReceipts.length})
        </h3>

        {activeReceipts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">Aucun reçu fiscal</h3>
            <p className="mt-1 text-sm text-gray-500">
              Cliquez sur &quot;Générer les reçus manquants&quot; pour créer les reçus.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    N° Reçu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date du don
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Campagne
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {activeReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-purple-400">
                        {receipt.receiptNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {formatDate(receipt.donationDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-400">
                      {formatCurrency(receipt.amount, receipt.country)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {receipt.Donation.campaignName || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getReceiptTypeBadge(receipt.receiptType)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(receipt.status)}
                      {receipt.sentAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(receipt.sentAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(receipt.id)}
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          PDF
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendReceipt(receipt.id)}
                          disabled={sendingReceipt === receipt.id}
                        >
                          {sendingReceipt === receipt.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                          Envoyer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoidReceipt(receipt.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Voided Receipts */}
      {voidedReceipts.length > 0 && (
        <Card className="mt-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Reçus annulés ({voidedReceipts.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    N° Reçu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date émission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {voidedReceipts.map((receipt) => (
                  <tr key={receipt.id} className="opacity-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-500 line-through">
                        {receipt.receiptNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 line-through">
                      {formatCurrency(receipt.amount, receipt.country)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(receipt.issueDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="danger">Annulé</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="mt-6 bg-blue-900/20 border-blue-800">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-400 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-300">
              À propos des reçus fiscaux
            </h4>
            <ul className="mt-2 text-sm text-blue-200/70 space-y-1">
              <li>• Les reçus sont générés automatiquement après chaque don complété</li>
              <li>• Le numéro de reçu suit un format séquentiel : ANNÉE-NUMÉRO</li>
              <li>• Vous pouvez télécharger le PDF ou l&apos;envoyer par email</li>
              <li>• Les reçus annulés sont conservés pour audit mais ne sont plus valides</li>
              <li>• Les reçus sont conformes aux exigences de l&apos;ARC (Canada) et du CGI (France)</li>
            </ul>
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
