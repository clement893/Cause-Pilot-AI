"use client";

import Link from "next/link";
import { DonationForm, FORM_TYPE_LABELS, FORM_STATUS_LABELS, FORM_STATUS_COLORS } from "@/types/form";

interface FormCardProps {
  form: DonationForm;
  onDelete?: (id: string) => void;
}

export default function FormCard({ form, onDelete }: FormCardProps) {
  const progress = form.goalAmount 
    ? Math.min((form.totalCollected / form.goalAmount) * 100, 100)
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header avec couleur du formulaire */}
      <div 
        className="h-2"
        style={{ backgroundColor: form.primaryColor }}
      />
      
      <div className="p-6">
        {/* Type et Status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {FORM_TYPE_LABELS[form.formType]}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${FORM_STATUS_COLORS[form.status]}`}>
            {FORM_STATUS_LABELS[form.status]}
          </span>
        </div>

        {/* Nom du formulaire */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {form.name}
        </h3>

        {/* Description */}
        {form.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {form.description}
          </p>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(form.totalCollected)}
            </p>
            <p className="text-xs text-gray-500">Collecté</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {form.donationCount}
            </p>
            <p className="text-xs text-gray-500">Dons</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(form.averageDonation)}
            </p>
            <p className="text-xs text-gray-500">Moy.</p>
          </div>
        </div>

        {/* Barre de progression si objectif défini */}
        {progress !== null && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{progress.toFixed(0)}% de l&apos;objectif</span>
              <span>{formatCurrency(form.goalAmount!)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: form.primaryColor,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <Link
            href={`/forms/${form.id}`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Voir
          </Link>
          <Link
            href={`/forms/${form.id}/edit`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: form.primaryColor }}
          >
            Modifier
          </Link>
          {form.status === "PUBLISHED" && (
            <Link
              href={`/donate/${form.slug}`}
              target="_blank"
              className="px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              title="Voir le formulaire public"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
          {onDelete && form.status === "DRAFT" && (
            <button
              onClick={() => onDelete(form.id)}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              title="Supprimer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
