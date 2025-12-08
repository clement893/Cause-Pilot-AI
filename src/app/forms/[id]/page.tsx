"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { DonationForm, DonationSubmission, FORM_TYPE_LABELS, FORM_STATUS_LABELS, FORM_STATUS_COLORS } from "@/types/form";

export default function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<DonationForm | null>(null);
  const [submissions, setSubmissions] = useState<DonationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "submissions">("overview");

  useEffect(() => {
    fetchForm();
    fetchSubmissions();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/donate?formId=${id}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!form) {
    return (
      <AppLayout breadcrumbs={[{ name: "Formulaires Don", href: "/forms" }, { name: "Non trouvé" }]}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-white">Formulaire non trouvé</h2>
          <Link href="/forms" className="mt-4 text-pink-400 hover:text-pink-300">
            Retour à la liste
          </Link>
        </div>
      </AppLayout>
    );
  }

  const progress = form.goalAmount 
    ? Math.min((form.totalCollected / form.goalAmount) * 100, 100)
    : null;

  return (
    <AppLayout 
      breadcrumbs={[
        { name: "Formulaires Don", href: "/forms" },
        { name: form.name }
      ]}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{form.name}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${FORM_STATUS_COLORS[form.status]}`}>
                {FORM_STATUS_LABELS[form.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">{FORM_TYPE_LABELS[form.formType]}</p>
          </div>
          <div className="flex items-center gap-3">
            {form.status === "PUBLISHED" && (
              <Link
                href={`/donate/${form.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Voir le formulaire
              </Link>
            )}
            <Link
              href={`/forms/${form.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-sm text-gray-400 mb-1">Total collecté</p>
          <p className="text-3xl font-bold" style={{ color: form.primaryColor }}>
            {formatCurrency(form.totalCollected)}
          </p>
          {progress !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{progress.toFixed(0)}%</span>
                <span>Objectif: {formatCurrency(form.goalAmount!)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: form.primaryColor }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-sm text-gray-400 mb-1">Nombre de dons</p>
          <p className="text-3xl font-bold text-white">{form.donationCount}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-sm text-gray-400 mb-1">Don moyen</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(form.averageDonation)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <p className="text-sm text-gray-400 mb-1">Montants suggérés</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {form.suggestedAmounts.map((amount, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-700 text-gray-300 text-sm rounded">
                {amount}$
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Aperçu
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "submissions"
                ? "border-pink-500 text-pink-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Soumissions ({submissions.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Slug URL</dt>
                <dd className="text-sm font-medium text-white">/donate/{form.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Montant minimum</dt>
                <dd className="text-sm font-medium text-white">{formatCurrency(form.minimumAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Montant maximum</dt>
                <dd className="text-sm font-medium text-white">
                  {form.maximumAmount ? formatCurrency(form.maximumAmount) : "Aucune limite"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Montant personnalisé</dt>
                <dd className="text-sm font-medium text-white">
                  {form.allowCustomAmount ? "Oui" : "Non"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-400">Dons anonymes</dt>
                <dd className="text-sm font-medium text-white">
                  {form.allowAnonymous ? "Permis" : "Non permis"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Champs collectés */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informations collectées</h3>
            <div className="space-y-2">
              {[
                { label: "Téléphone", value: form.collectPhone },
                { label: "Adresse", value: form.collectAddress },
                { label: "Employeur", value: form.collectEmployer },
                { label: "Commentaire", value: form.collectComment },
                { label: "Dédicace", value: form.collectDedication },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  {value ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${value ? "text-white" : "text-gray-500"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Personnalisation */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Personnalisation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Couleurs</p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-slate-600" style={{ backgroundColor: form.primaryColor }} />
                    <span className="text-sm text-gray-300">Principale</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-slate-600" style={{ backgroundColor: form.secondaryColor }} />
                    <span className="text-sm text-gray-300">Secondaire</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Message de remerciement</p>
                <p className="text-sm text-gray-300 bg-slate-800 p-3 rounded-lg">
                  {form.thankYouMessage || "Aucun message personnalisé"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Submissions Table */
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">Aucune soumission</h3>
              <p className="mt-1 text-sm text-gray-400">Les dons apparaîtront ici une fois reçus.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Donateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Reçu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {submission.isAnonymous ? "Anonyme" : `${submission.firstName} ${submission.lastName}`}
                        </p>
                        <p className="text-sm text-gray-400">{submission.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(submission.amount)}
                      </p>
                      {submission.isRecurring && (
                        <span className="text-xs text-pink-400">Récurrent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        submission.paymentStatus === "COMPLETED" 
                          ? "bg-green-900 text-green-300"
                          : submission.paymentStatus === "PENDING"
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-red-900 text-red-300"
                      }`}>
                        {submission.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {submission.receiptNumber || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppLayout>
  );
}
