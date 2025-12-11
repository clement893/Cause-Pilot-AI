"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { DonationForm, FORM_TYPE_LABELS } from "@/types/form";

interface PersonalizedData {
  isRecognized: boolean;
  donor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  suggestedAmounts: number[];
  recommendedAmount: number | null;
  lastDonation: {
    amount: number;
    date: string;
    campaignName?: string;
  } | null;
  donorStats: {
    totalDonations: number;
    donationCount: number;
    averageDonation: number;
    isRecurring: boolean;
  } | null;
  welcomeMessage: string | null;
  donorToken?: string;
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

  // Personnalisation
  const [personalized, setPersonalized] = useState<PersonalizedData | null>(null);
  const [displayAmounts, setDisplayAmounts] = useState<number[]>([]);
  const [checkingEmail, setCheckingEmail] = useState(false);

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
    dedicationType: "",
    dedicateeName: "",
    dedicateeEmail: "",
    dedicateeMessage: "",
    notifyDedicatee: false,
  });

  // Récupérer le token du cookie au chargement
  useEffect(() => {
    const donorToken = getCookie("donor_token");
    if (donorToken && form) {
      personalizeForm(undefined, donorToken);
    }
  }, [form]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${slug}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status !== "PUBLISHED") {
          setError("Ce formulaire n'est pas disponible.");
        } else {
          setForm(data);
          setDisplayAmounts(data.suggestedAmounts);
          if (data.defaultAmount) {
            setSelectedAmount(data.defaultAmount);
          }
        }
      } else {
        setError("Formulaire non trouvé.");
      }
    } catch {
      setError("Erreur lors du chargement du formulaire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForm();
  }, [slug]);

  // Personnaliser le formulaire pour un donateur reconnu
  const personalizeForm = useCallback(async (email?: string, token?: string) => {
    if (!form) return;

    try {
      const response = await fetch("/api/forms/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          email,
          donorToken: token,
        }),
      });

      if (response.ok) {
        const data: PersonalizedData = await response.json();
        setPersonalized(data);

        if (data.isRecognized && data.donor) {
          // Pré-remplir les informations du donateur
          setDonorInfo((prev) => ({
            ...prev,
            email: data.donor!.email || prev.email,
            firstName: data.donor!.firstName || prev.firstName,
            lastName: data.donor!.lastName || prev.lastName,
            phone: data.donor!.phone || prev.phone,
            address: data.donor!.address || prev.address,
            city: data.donor!.city || prev.city,
            state: data.donor!.state || prev.state,
            postalCode: data.donor!.postalCode || prev.postalCode,
            country: data.donor!.country || prev.country,
          }));

          // Utiliser les montants personnalisés
          if (data.suggestedAmounts.length > 0) {
            setDisplayAmounts(data.suggestedAmounts);
          }

          // Sélectionner le montant recommandé
          if (data.recommendedAmount) {
            setSelectedAmount(data.recommendedAmount);
          }

          // Sauvegarder le token dans un cookie
          if (data.donorToken) {
            setCookie("donor_token", data.donorToken, 365);
          }
        }
      }
    } catch (err) {
      console.error("Erreur personnalisation:", err);
    }
  }, [form]);

  // Vérifier l'email pour personnalisation
  const handleEmailBlur = async () => {
    if (!donorInfo.email || !form) return;

    // Valider le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorInfo.email)) return;

    setCheckingEmail(true);
    await personalizeForm(donorInfo.email);
    setCheckingEmail(false);
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
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          formId: form.id,
          donorEmail: donorInfo.email,
          donorFirstName: donorInfo.firstName,
          donorLastName: donorInfo.lastName,
          isRecurring: form.formType === "RECURRING",
          recurringFrequency: form.recurringOptions?.[0] || "MONTHLY",
          campaignId: form.campaignId || undefined,
          comment: donorInfo.comment || undefined,
          isAnonymous: donorInfo.isAnonymous,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
          {/* Message de bienvenue personnalisé */}
          {personalized?.isRecognized && personalized.welcomeMessage && (
            <div 
              className="px-6 py-4 flex items-center gap-3"
              style={{ backgroundColor: form.primaryColor + "10" }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: form.primaryColor }}
              >
                {personalized.donor?.firstName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-medium text-gray-900">{personalized.welcomeMessage}</p>
                {personalized.lastDonation && (
                  <p className="text-sm text-gray-600">
                    Votre dernier don : {formatCurrency(personalized.lastDonation.amount)} le {formatDate(personalized.lastDonation.date)}
                  </p>
                )}
              </div>
            </div>
          )}

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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Choisissez votre montant
                </h2>

                {/* Indicateur de montant recommandé */}
                {personalized?.recommendedAmount && (
                  <p className="text-sm text-gray-600 mb-6">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: form.primaryColor + "20", color: form.primaryColor }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Recommandé pour vous
                    </span>
                    {" "}Basé sur votre historique de dons
                  </p>
                )}

                {/* Montants suggérés */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {displayAmounts.map((amount) => {
                    const isRecommended = personalized?.recommendedAmount === amount;
                    return (
                      <button
                        key={amount}
                        onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                        className={`relative py-4 px-4 rounded-lg text-lg font-semibold transition-all ${
                          selectedAmount === amount
                            ? "text-white ring-2 ring-offset-2"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        style={selectedAmount === amount ? { 
                          backgroundColor: form.primaryColor,
                          ringColor: form.primaryColor,
                        } : isRecommended ? {
                          borderColor: form.primaryColor,
                          borderWidth: "2px",
                        } : {}}
                      >
                        {isRecommended && selectedAmount !== amount && (
                          <span 
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: form.primaryColor }}
                          >
                            ★
                          </span>
                        )}
                        {amount} $
                      </button>
                    );
                  })}
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

                {/* Indicateur de pré-remplissage */}
                {personalized?.isRecognized && (
                  <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: form.primaryColor + "10" }}>
                    <svg className="w-5 h-5 mt-0.5" style={{ color: form.primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Informations pré-remplies</p>
                      <p className="text-sm text-gray-600">
                        Nous avons retrouvé vos informations. Vous pouvez les modifier si nécessaire.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email en premier pour la détection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courriel *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={donorInfo.email}
                        onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                        onBlur={handleEmailBlur}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="votre@email.com"
                      />
                      {checkingEmail && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: form.primaryColor }}></div>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Entrez votre email pour retrouver vos informations
                    </p>
                  </div>

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

                  {form.collectPhone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone {form.requirePhone && "*"}
                      </label>
                      <input
                        type="tel"
                        required={form.requirePhone}
                        value={donorInfo.phone}
                        onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>
                  )}

                  {form.collectAddress && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adresse {form.requireAddress && "*"}
                        </label>
                        <input
                          type="text"
                          required={form.requireAddress}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employeur {form.requireEmployer && "*"}
                      </label>
                      <input
                        type="text"
                        required={form.requireEmployer}
                        value={donorInfo.employer}
                        onChange={(e) => setDonorInfo({ ...donorInfo, employer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      />
                    </div>
                  )}

                  {form.collectComment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commentaire
                      </label>
                      <textarea
                        value={donorInfo.comment}
                        onChange={(e) => setDonorInfo({ ...donorInfo, comment: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        placeholder="Laissez un message (optionnel)"
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-3 pt-4 border-t">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={donorInfo.isAnonymous}
                        onChange={(e) => setDonorInfo({ ...donorInfo, isAnonymous: e.target.checked })}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: form.primaryColor }}
                      />
                      <span className="text-sm text-gray-700">Faire un don anonyme</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={donorInfo.consentEmail}
                        onChange={(e) => setDonorInfo({ ...donorInfo, consentEmail: e.target.checked })}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: form.primaryColor }}
                      />
                      <span className="text-sm text-gray-700">
                        J&apos;accepte de recevoir des communications par courriel
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setStep("amount")}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      if (!donorInfo.email || !donorInfo.firstName || !donorInfo.lastName) {
                        setError("Veuillez remplir tous les champs obligatoires");
                        return;
                      }
                      setStep("payment");
                      setError(null);
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
                      <span className="text-gray-900">{donorInfo.firstName} {donorInfo.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Courriel</span>
                      <span className="text-gray-900">{donorInfo.email}</span>
                    </div>
                    {form.formType === "RECURRING" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fréquence</span>
                        <span className="text-gray-900">Mensuel</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep("info")}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Procéder au paiement
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-4 text-xs text-center text-gray-500">
                  Paiement sécurisé par Stripe. Vos informations sont protégées.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utilitaires pour les cookies
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop()!.split(";").shift()!);
  }
  return null;
}
