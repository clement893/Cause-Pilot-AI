"use client";

import { useState, useEffect, use } from "react";
import {
  Shield,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Heart,
} from "lucide-react";

interface DonorPreferences {
  firstName: string;
  email: string | null;
  consentEmail: boolean;
  consentPhone: boolean;
  consentMail: boolean;
  consentDate: string | null;
  preferences: {
    preferredChannel: string;
    preferredFrequency: string;
    preferredLanguage: string;
    causesOfInterest: string[];
  } | null;
}

export default function PreferenceCenterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [donor, setDonor] = useState<DonorPreferences | null>(null);

  // États des consentements
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentPhone, setConsentPhone] = useState(false);
  const [consentMail, setConsentMail] = useState(false);
  const [preferredFrequency, setPreferredFrequency] = useState("MONTHLY");
  const [preferredLanguage, setPreferredLanguage] = useState("fr");

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/preferences/${token}`);
        if (!response.ok) {
          throw new Error("Lien invalide ou expiré");
        }
        const data = await response.json();
        setDonor(data.donor);
        setConsentEmail(data.donor.consentEmail);
        setConsentPhone(data.donor.consentPhone);
        setConsentMail(data.donor.consentMail);
        if (data.donor.preferences) {
          setPreferredFrequency(data.donor.preferences.preferredFrequency);
          setPreferredLanguage(data.donor.preferences.preferredLanguage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/preferences/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentEmail,
          consentPhone,
          consentMail,
          preferences: {
            preferredFrequency,
            preferredLanguage,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!confirm("Êtes-vous sûr de vouloir vous désinscrire de toutes les communications ?")) {
      return;
    }

    setConsentEmail(false);
    setConsentPhone(false);
    setConsentMail(false);

    setSaving(true);
    try {
      await fetch(`/api/preferences/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentEmail: false,
          consentPhone: false,
          consentMail: false,
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError("Erreur lors de la désinscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error && !donor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-surface-secondary/50 backdrop-blur-sm rounded-2xl border border-border p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-error-light mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-muted-foreground">
            Ce lien de préférences n&apos;est plus valide ou a expiré.
            Veuillez contacter notre équipe pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Centre de Préférences
          </h1>
          <p className="text-muted-foreground">
            Bonjour {donor?.firstName}, gérez vos préférences de communication
          </p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-success/20 border border-green-500/50 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success-light" />
            <p className="text-green-300">Vos préférences ont été mises à jour avec succès.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error/20 border border-red-500/50 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error-light" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Consentements */}
        <div className="bg-surface-secondary/50 backdrop-blur-sm rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-semibold text-white">
              Vos Consentements
            </h2>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <label className="flex items-start gap-4 p-4 bg-surface-tertiary/50 rounded-xl cursor-pointer hover:bg-surface-tertiary/70 transition-colors">
              <input
                type="checkbox"
                checked={consentEmail}
                onChange={(e) => setConsentEmail(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-slate-500 text-accent focus:ring-pink-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-info-light" />
                  <span className="font-medium text-white">Communications par email</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recevez nos newsletters, mises à jour sur nos campagnes et appels aux dons par email.
                </p>
              </div>
            </label>

            {/* Téléphone */}
            <label className="flex items-start gap-4 p-4 bg-surface-tertiary/50 rounded-xl cursor-pointer hover:bg-surface-tertiary/70 transition-colors">
              <input
                type="checkbox"
                checked={consentPhone}
                onChange={(e) => setConsentPhone(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-slate-500 text-accent focus:ring-pink-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-success-light" />
                  <span className="font-medium text-white">Communications téléphoniques</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Acceptez d&apos;être contacté par téléphone pour des informations importantes.
                </p>
              </div>
            </label>

            {/* Courrier */}
            <label className="flex items-start gap-4 p-4 bg-surface-tertiary/50 rounded-xl cursor-pointer hover:bg-surface-tertiary/70 transition-colors">
              <input
                type="checkbox"
                checked={consentMail}
                onChange={(e) => setConsentMail(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-slate-500 text-accent focus:ring-pink-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <span className="font-medium text-white">Communications postales</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recevez nos communications par courrier postal (rapports annuels, invitations).
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Préférences de fréquence */}
        <div className="bg-surface-secondary/50 backdrop-blur-sm rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Fréquence des communications
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "WEEKLY", label: "Hebdomadaire" },
              { value: "BIWEEKLY", label: "Bi-mensuelle" },
              { value: "MONTHLY", label: "Mensuelle" },
              { value: "QUARTERLY", label: "Trimestrielle" },
            ].map((option) => (
              <label
                key={option.value}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  preferredFrequency === option.value
                    ? "border-accent bg-accent/20"
                    : "border-border bg-surface-tertiary/50 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={preferredFrequency === option.value}
                  onChange={(e) => setPreferredFrequency(e.target.value)}
                  className="sr-only"
                />
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Langue préférée */}
        <div className="bg-surface-secondary/50 backdrop-blur-sm rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Langue préférée
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "fr", label: "Français" },
              { value: "en", label: "English" },
            ].map((option) => (
              <label
                key={option.value}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  preferredLanguage === option.value
                    ? "border-accent bg-accent/20"
                    : "border-border bg-surface-tertiary/50 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={preferredLanguage === option.value}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="sr-only"
                />
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Enregistrer mes préférences
          </button>

          <button
            onClick={handleUnsubscribeAll}
            disabled={saving}
            className="px-6 py-3 bg-surface-tertiary text-foreground rounded-xl font-medium hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            Me désinscrire de tout
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-text-tertiary">
          <p>
            Conformément au RGPD et à la loi PIPEDA, vous pouvez modifier vos préférences à tout moment.
          </p>
          {donor?.consentDate && (
            <p className="mt-2">
              Dernier consentement : {new Date(donor.consentDate).toLocaleDateString("fr-CA")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
