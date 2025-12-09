"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Heart, Mail, Download, ArrowRight } from "lucide-react";

interface SessionDetails {
  amount: number;
  email: string;
  formName: string;
  campaignName?: string;
  isRecurring: boolean;
}

export default function DonateSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const formId = searchParams.get("form_id");
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const res = await fetch(`/api/payments/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionDetails(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Merci pour votre don !
        </h1>
        <p className="text-gray-600 mb-6">
          Votre générosité fait une réelle différence.
        </p>

        {/* Donation Details */}
        {loading ? (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-gray-500">Chargement des détails...</p>
          </div>
        ) : sessionDetails ? (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Montant</span>
              <span className="text-2xl font-bold text-green-600">
                {sessionDetails.amount.toFixed(2)} $
              </span>
            </div>
            {sessionDetails.isRecurring && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Type</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Don récurrent
                </span>
              </div>
            )}
            {sessionDetails.campaignName && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Campagne</span>
                <span className="text-gray-900 font-medium">
                  {sessionDetails.campaignName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Confirmation envoyée à</span>
              <span className="text-gray-900">{sessionDetails.email}</span>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <Heart className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800">
              Votre don a été traité avec succès !
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-left">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Un reçu de confirmation vous sera envoyé par email.
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg text-left">
            <Download className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-800">
              Votre reçu fiscal sera disponible en début d&apos;année prochaine.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Retour à l&apos;accueil
            <ArrowRight className="w-4 h-4" />
          </Link>
          {formId && (
            <Link
              href={`/donate/${formId}`}
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Faire un autre don
            </Link>
          )}
        </div>

        {/* Social Share */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            Partagez votre geste et inspirez d&apos;autres personnes
          </p>
          <div className="flex justify-center gap-3">
            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
            <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
