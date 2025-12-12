"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { CheckCircle, XCircle, Mail, AlertTriangle } from "lucide-react";

interface DonorInfo {
  firstName: string;
  lastName: string;
  email: string;
  isSubscribed: boolean;
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donor, setDonor] = useState<DonorInfo | null>(null);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token && email) {
      verifyToken();
    } else {
      setError("Lien de désabonnement invalide");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/unsubscribe?token=${token}&email=${encodeURIComponent(email || "")}`);
      const data = await response.json();

      if (data.success) {
        setDonor(data.donor);
        if (!data.donor.isSubscribed) {
          setUnsubscribed(true);
        }
      } else {
        setError(data.error || "Lien de désabonnement invalide");
      }
    } catch {
      setError("Erreur lors de la vérification du lien");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, reason }),
      });
      const data = await response.json();

      if (data.success) {
        setUnsubscribed(true);
      } else {
        setError(data.error || "Erreur lors du désabonnement");
      }
    } catch {
      setError("Erreur lors du désabonnement");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-surface-primary border-border p-8 text-center">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-error-light" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Erreur</h1>
          <p className="text-slate-400">{error}</p>
        </Card>
      </div>
    );
  }

  if (unsubscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-surface-primary border-border p-8 text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-light" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Désabonnement confirmé</h1>
          <p className="text-slate-400 mb-4">
            Vous ne recevrez plus d&apos;emails de notre part à l&apos;adresse {donor?.email}.
          </p>
          <p className="text-sm text-slate-500">
            Si vous changez d&apos;avis, vous pouvez vous réabonner en nous contactant directement.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-surface-primary border-border p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Gestion des préférences email</h1>
          <p className="text-slate-400">
            Bonjour {donor?.firstName}, vous êtes sur le point de vous désabonner de nos communications.
          </p>
        </div>

        <div className="bg-surface-secondary/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-medium mb-1">Attention</p>
              <p className="text-slate-400">
                En vous désabonnant, vous ne recevrez plus nos newsletters, mises à jour sur nos projets, 
                et informations sur l&apos;impact de vos dons.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Raison du désabonnement (optionnel)
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Sélectionnez une raison...</option>
            <option value="too_many">Je reçois trop d&apos;emails</option>
            <option value="not_relevant">Le contenu n&apos;est pas pertinent</option>
            <option value="never_signed_up">Je ne me suis jamais inscrit</option>
            <option value="other">Autre raison</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border text-slate-300 hover:bg-surface-secondary"
            onClick={() => window.close()}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={handleUnsubscribe}
            disabled={processing}
          >
            {processing ? "Traitement..." : "Se désabonner"}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          Conformément au RGPD, vous avez le droit de retirer votre consentement à tout moment.
        </p>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
