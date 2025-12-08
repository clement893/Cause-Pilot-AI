"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FormCard from "@/components/forms/FormCard";
import { DonationForm, FormType, FormStatus, FORM_TYPE_LABELS, FORM_STATUS_LABELS } from "@/types/form";

interface FormStats {
  overview: {
    totalForms: number;
    publishedForms: number;
    draftForms: number;
    totalSubmissions: number;
    totalCollected: number;
    totalDonations: number;
    averageDonation: number;
  };
}

export default function FormsPage() {
  const [forms, setForms] = useState<DonationForm[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FormType | "">("");
  const [filterStatus, setFilterStatus] = useState<FormStatus | "">("");

  useEffect(() => {
    fetchForms();
    fetchStats();
  }, [filterType, filterStatus]);

  const fetchForms = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("formType", filterType);
      if (filterStatus) params.append("status", filterStatus);
      params.append("limit", "50");

      const response = await fetch(`/api/forms?${params}`);
      const data = await response.json();
      setForms(data.data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/forms/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce formulaire?")) return;

    try {
      const response = await fetch(`/api/forms/${id}`, { method: "DELETE" });
      if (response.ok) {
        setForms(forms.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Formulaires de Don</h1>
                <p className="text-sm text-gray-500">Gérez vos formulaires de collecte</p>
              </div>
            </div>
            <Link
              href="/forms/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau formulaire
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Total collecté</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.overview.totalCollected)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Nombre de dons</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.overview.totalDonations}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Don moyen</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.overview.averageDonation)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Formulaires actifs</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.overview.publishedForms} / {stats.overview.totalForms}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FormType | "")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les types</option>
                {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FormStatus | "")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(FORM_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {(filterType || filterStatus) && (
              <button
                onClick={() => { setFilterType(""); setFilterStatus(""); }}
                className="mt-5 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun formulaire</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer votre premier formulaire de don.</p>
            <div className="mt-6">
              <Link
                href="/forms/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau formulaire
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <FormCard key={form.id} form={form} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
