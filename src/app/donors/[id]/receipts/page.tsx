"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Card, Badge, Spinner } from "@/components/ui";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donationDate: string;
  paymentMethod: string;
  status: string;
  receiptNumber: string | null;
  receiptSentAt: string | null;
  campaign?: {
    name: string;
  } | null;
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
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch donor info
        const donorRes = await fetch(`/api/donors/${id}`);
        const donorData = await donorRes.json();
        if (donorData.success) {
          setDonor(donorData.data);
        }

        // Fetch donations
        const donationsRes = await fetch(`/api/donors/${id}/donations`);
        const donationsData = await donationsRes.json();
        if (donationsData.success) {
          setDonations(donationsData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDownloadReceipt = async (donationId: string) => {
    window.open(`/api/receipts/${donationId}`, "_blank");
  };

  const handleSendReceipt = async (donationId: string) => {
    setSendingReceipt(donationId);
    try {
      const res = await fetch(`/api/receipts/${donationId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      
      if (data.success) {
        alert("Reçu envoyé avec succès!");
        // Refresh donations to update receipt status
        const donationsRes = await fetch(`/api/donors/${id}/donations`);
        const donationsData = await donationsRes.json();
        if (donationsData.success) {
          setDonations(donationsData.data);
        }
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

  const formatCurrency = (amount: number, currency: string = "CAD") => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const completedDonations = donations.filter((d) => d.status === "COMPLETED");

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

      {/* Donations List */}
      <Card className="bg-slate-900 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Dons complétés ({completedDonations.length})
        </h3>

        {completedDonations.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-white">Aucun don complété</h3>
            <p className="mt-1 text-sm text-gray-500">
              Les reçus fiscaux seront disponibles après les dons.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Campagne
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    N° Reçu
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
                {completedDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {formatDate(donation.donationDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-400">
                      {formatCurrency(donation.amount, donation.currency)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {donation.campaign?.name || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {donation.receiptNumber || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {donation.receiptSentAt ? (
                        <Badge variant="success">Envoyé</Badge>
                      ) : (
                        <Badge variant="warning">Non envoyé</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(donation.id)}
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
                          onClick={() => handleSendReceipt(donation.id)}
                          disabled={sendingReceipt === donation.id}
                        >
                          {sendingReceipt === donation.id ? (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
            <p className="mt-1 text-sm text-blue-200/70">
              Les reçus fiscaux sont générés automatiquement après chaque don complété. 
              Vous pouvez télécharger le PDF ou l&apos;envoyer directement par email au donateur.
              Les reçus sont conformes aux exigences de l&apos;Agence du revenu du Canada.
            </p>
          </div>
        </div>
      </Card>
    </AppLayout>
  );
}
