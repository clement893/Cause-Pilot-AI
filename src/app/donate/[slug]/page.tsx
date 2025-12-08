"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { DonationForm, FORM_TYPE_LABELS } from "@/types/form";

interface DonationData {
  formId: string;
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  employer?: string;
  comment?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  dedicationType?: string;
  dedicateeName?: string;
  dedicateeEmail?: string;
  dedicateeMessage?: string;
  notifyDedicatee?: boolean;
  isAnonymous?: boolean;
  consentEmail?: boolean;
  consentNewsletter?: boolean;
}

export default function DonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<DonationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ transactionId: string; receiptNumber: string } | null>(null);

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [step, setStep] = useState<"amount" | "info" | "payment">("amount");

  const [donorInfo, setDonorInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "QC",
    postalCode: "",
    country: "Canada",
    employer: "",
    comment: "",
    isAnonymous: false,
    consentEmail: false,
    consentNewsletter: false,
    // In Memoriam
    dedicationType: "",
    dedicateeName: "",
    dedicateeEmail: "",
    dedicateeMessage: "",
    notifyDedicatee: false,
  });

  useEffect(() => {
    fetchForm();
  }, [slug]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status !== "PUBLISHED") {
          setError("Ce formulaire n'est pas disponible.");
        } else {
          setForm(data);
          if (data.defaultAmount) {
            setSelectedAmount(data.defaultAmount);
          }
        }
      } else {
        setError("Formulaire non trouvé.");
      }
    } catch (err) {
      setError("Erreur lors du chargement du formulaire.");
    } finally {
      setLoading(false);
    }
  };

  const getAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseFloat(customAmount);
    return 0;
  };

  const handleSubmit = async () => {
    if (!form) return;

    const amount = getAmount();
    if (amount < form.minimumAmount) {
      setError(`Le montant minimum est de ${form.minimumAmount} $`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const donationData: DonationData = {
        formId: form.id,
        amount,
        email: donorInfo.email,
        firstName: donorInfo.firstName,
        lastName: donorInfo.lastName,
        phone: donorInfo.phone || undefined,
        address: donorInfo.address || undefined,
        city: donorInfo.city || undefined,
        state: donorInfo.state || undefined,
        postalCode: donorInfo.postalCode || undefined,
        country: donorInfo.country,
        employer: donorInfo.employer || undefined,
        comment: donorInfo.comment || undefined,
        isAnonymous: donorInfo.isAnonymous,
        consentEmail: donorInfo.consentEmail,
        consentNewsletter: donorInfo.consentNewsletter,
      };

      // Ajouter les infos de dédicace si applicable
      if (form.collectDedication && donorInfo.dedicationType) {
        donationData.dedicationType = donorInfo.dedicationType;
        donationData.dedicateeName = donorInfo.dedicateeName;
        donationData.dedicateeEmail = donorInfo.dedicateeEmail;
        donationData.dedicateeMessage = donorInfo.dedicateeMessage;
        donationData.notifyDedicatee = donorInfo.notifyDedicatee;
      }

      const response = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setResult({
        transactionId: data.data.transactionId,
        receiptNumber: data.data.receiptNumber,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
          <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-800">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Page de succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: form.primaryColor }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: form.primaryColor + "20" }}>
            <svg className="w-8 h-8" style={{ color: form.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Merci pour votre don!</h1>
          <p className="text-gray-600 mb-6">{form.thankYouMessage}</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Montant du don</p>
            <p className="text-2xl font-bold" style={{ color: form.primaryColor }}>
              {formatCurrency(getAmount())}
            </p>
            {result && (
              <>
                <p className="text-sm text-gray-500 mt-3 mb-1">Numéro de reçu</p>
                <p className="text-sm font-medium text-gray-900">{result.receiptNumber}</p>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Un reçu fiscal vous sera envoyé par courriel à l&apos;adresse {donorInfo.email}
          </p>

          <Link
            href="/"
            className="inline-block px-6 py-3 text-white rounded-lg transition-colors"
            style={{ backgroundColor: form.primaryColor }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const progress = form.goalAmount 
    ? Math.min((form.totalCollected / form.goalAmount) * 100, 100)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header avec gradient */}
      <div 
        className="py-12 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)` 
        }}
      >
        <div className="max-w-2xl mx-auto text-center text-white">
          <p className="text-sm uppercase tracking-wide opacity-80 mb-2">
            {FORM_TYPE_LABELS[form.formType]}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{form.name}</h1>
          {form.description && (
            <p className="text-lg opacity-90">{form.description}</p>
          )}
          
          {/* Barre de progression */}
          {progress !== null && (
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span>{formatCurrency(form.totalCollected)} collectés</span>
                <span>Objectif: {formatCurrency(form.goalAmount!)}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm">{form.donationCount} donateurs</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl mx-auto px-4 py-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Étapes */}
          <div className="flex border-b">
            {["amount", "info", "payment"].map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  if (s === "amount") setStep("amount");
                  else if (s === "info" && getAmount() >= form.minimumAmount) setStep("info");
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  step === s 
                    ? "text-white" 
                    : "text-gray-500 bg-gray-50"
                }`}
                style={step === s ? { backgroundColor: form.primaryColor } : {}}
              >
                {i + 1}. {s === "amount" ? "Montant" : s === "info" ? "Informations" : "Confirmation"}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Étape 1: Montant */}
            {step === "amount" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Choisissez votre montant
                </h2>

                {/* Montants suggérés */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {form.suggestedAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                      className={`py-4 px-4 rounded-lg text-lg font-semibold transition-all ${
                        selectedAmount === amount
                          ? "text-white ring-2 ring-offset-2"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={selectedAmount === amount ? { 
                        backgroundColor: form.primaryColor,
                      } : {}}
                    >
                      {amount} $
                    </button>
                  ))}
                </div>

                {/* Montant personnalisé */}
                {form.allowCustomAmount && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ou entrez un montant personnalisé
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min={form.minimumAmount}
                        max={form.maximumAmount || undefined}
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:border-transparent"
                        style={{ focusRingColor: form.primaryColor } as React.CSSProperties}
                        placeholder={`Minimum ${form.minimumAmount} $`}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (getAmount() >= form.minimumAmount) {
                      setStep("info");
                      setError(null);
                    } else {
                      setError(`Le montant minimum est de ${form.minimumAmount} $`);
                    }
                  }}
                  disabled={getAmount() < form.minimumAmount}
                  className="w-full py-4 text-white text-lg font-semibold rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  Continuer avec {formatCurrency(getAmount())}
                </button>
              </div>
            )}

            {/* Étape 2: Informations */}
            {step === "info" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Vos informations
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={donorInfo.firstName}
                        onChange={(e) => setDonorInfo({ ...donorInfo, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={donorInfo.lastName}
                        onChange={(e) => setDonorInfo({ ...donorInfo, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courriel *</label>
                    <input
                      type="email"
                      required
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>

                  {form.collectPhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={donorInfo.phone}
                        onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>
                  )}

                  {form.collectAddress && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <input
                          type="text"
                          value={donorInfo.address}
                          onChange={(e) => setDonorInfo({ ...donorInfo, address: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                          <input
                            type="text"
                            value={donorInfo.city}
                            onChange={(e) => setDonorInfo({ ...donorInfo, city: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                          <input
                            type="text"
                            value={donorInfo.postalCode}
                            onChange={(e) => setDonorInfo({ ...donorInfo, postalCode: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {form.collectEmployer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employeur</label>
                      <input
                        type="text"
                        value={donorInfo.employer}
                        onChange={(e) => setDonorInfo({ ...donorInfo, employer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Pour les programmes de dons jumelés"
                      />
                    </div>
                  )}

                  {form.collectComment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                      <textarea
                        value={donorInfo.comment}
                        onChange={(e) => setDonorInfo({ ...donorInfo, comment: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Laissez un message..."
                      />
                    </div>
                  )}

                  {/* Options de dédicace pour In Memoriam */}
                  {form.collectDedication && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Faire un don en l&apos;honneur de quelqu&apos;un</h3>
                      <select
                        value={donorInfo.dedicationType}
                        onChange={(e) => setDonorInfo({ ...donorInfo, dedicationType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                      >
                        <option value="">Non, merci</option>
                        <option value="IN_MEMORY">En mémoire de</option>
                        <option value="IN_HONOR">En l&apos;honneur de</option>
                        <option value="TRIBUTE">En hommage à</option>
                      </select>
                      
                      {donorInfo.dedicationType && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={donorInfo.dedicateeName}
                            onChange={(e) => setDonorInfo({ ...donorInfo, dedicateeName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="Nom de la personne"
                          />
                          <input
                            type="email"
                            value={donorInfo.dedicateeEmail}
                            onChange={(e) => setDonorInfo({ ...donorInfo, dedicateeEmail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="Courriel pour notification (optionnel)"
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={donorInfo.notifyDedicatee}
                              onChange={(e) => setDonorInfo({ ...donorInfo, notifyDedicatee: e.target.checked })}
                              className="h-4 w-4 rounded"
                            />
                            <span className="text-sm text-gray-700">Envoyer une notification</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Options */}
                  <div className="border-t pt-4 mt-4 space-y-3">
                    {form.allowAnonymous && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={donorInfo.isAnonymous}
                          onChange={(e) => setDonorInfo({ ...donorInfo, isAnonymous: e.target.checked })}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-sm text-gray-700">Faire un don anonyme</span>
                      </label>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={donorInfo.consentEmail}
                        onChange={(e) => setDonorInfo({ ...donorInfo, consentEmail: e.target.checked })}
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-gray-700">J&apos;accepte de recevoir des communications par courriel</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep("amount")}
                    className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (donorInfo.email && donorInfo.firstName && donorInfo.lastName) {
                        setStep("payment");
                        setError(null);
                      } else {
                        setError("Veuillez remplir tous les champs obligatoires");
                      }
                    }}
                    className="flex-1 py-3 text-white rounded-lg transition-colors"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3: Confirmation */}
            {step === "payment" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Confirmer votre don
                </h2>

                {/* Récapitulatif */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Montant du don</span>
                    <span className="text-2xl font-bold" style={{ color: form.primaryColor }}>
                      {formatCurrency(getAmount())}
                    </span>
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Donateur</span>
                      <span className="text-gray-900">
                        {donorInfo.isAnonymous ? "Anonyme" : `${donorInfo.firstName} ${donorInfo.lastName}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Courriel</span>
                      <span className="text-gray-900">{donorInfo.email}</span>
                    </div>
                    {donorInfo.dedicationType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dédicace</span>
                        <span className="text-gray-900">
                          {donorInfo.dedicationType === "IN_MEMORY" ? "En mémoire de" : 
                           donorInfo.dedicationType === "IN_HONOR" ? "En l'honneur de" : "En hommage à"} {donorInfo.dedicateeName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6 text-center">
                  En cliquant sur &quot;Confirmer le don&quot;, vous acceptez nos conditions d&apos;utilisation.
                  Un reçu fiscal vous sera envoyé par courriel.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep("info")}
                    className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {submitting ? "Traitement..." : `Confirmer le don de ${formatCurrency(getAmount())}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sécurité */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Paiement sécurisé</span>
          </div>
          <p>Vos informations sont protégées par un cryptage SSL 256-bit</p>
        </div>
      </div>
    </div>
  );
}
