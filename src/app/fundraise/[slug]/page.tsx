"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Heart,
  Target,
  Users,
  Share2,
  Trophy,
  Clock,
  CheckCircle,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Copy,
  X,
} from "lucide-react";

interface Fundraiser {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  slug: string;
  title: string;
  story: string | null;
  videoUrl: string | null;
  goalAmount: number;
  totalRaised: number;
  donationCount: number;
  donorCount: number;
  status: string;
  points: number;
  level: number;
  badges: string[];
  primaryColor: string;
  coverImageUrl: string | null;
  progressPercent: number;
  campaign: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    bannerUrl: string | null;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  } | null;
  donations: Array<{
    id: string;
    amount: number;
    donorName: string | null;
    isAnonymous: boolean;
    message: string | null;
    createdAt: string;
  }>;
}

export default function PublicFundraisePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState(50);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donating, setDonating] = useState(false);
  const [donated, setDonated] = useState(false);

  useEffect(() => {
    fetchFundraiser();
  }, [resolvedParams.slug]);

  const fetchFundraiser = async () => {
    try {
      const res = await fetch(`/api/p2p/fundraisers/${resolvedParams.slug}`);
      if (res.ok) {
        const data = await res.json();
        setFundraiser(data);
      }
    } catch (error) {
      console.error("Error fetching fundraiser:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundraiser) return;

    setDonating(true);

    try {
      const res = await fetch("/api/p2p/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundraiserId: fundraiser.id,
          amount: donationAmount,
          donorName: isAnonymous ? null : donorName,
          donorEmail,
          isAnonymous,
          message: donorMessage,
        }),
      });

      if (res.ok) {
        setDonated(true);
        fetchFundraiser();
      } else {
        alert("Erreur lors du don. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Error donating:", error);
      alert("Erreur lors du don. Veuillez réessayer.");
    } finally {
      setDonating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Lien copié !");
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = fundraiser
    ? `Soutenez ${fundraiser.firstName} dans sa collecte pour ${fundraiser.campaign.name} !`
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!fundraiser || fundraiser.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page non trouvée</h1>
          <p className="text-gray-400 mb-6">Cette page de collecte n&apos;existe pas ou n&apos;est plus active.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Cover Image */}
      <div
        className="h-64 md:h-80 bg-gradient-to-r from-pink-500 to-purple-600 relative"
        style={{
          backgroundImage: fundraiser.coverImageUrl ? `url(${fundraiser.coverImageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg flex-shrink-0"
                  style={{ backgroundColor: fundraiser.primaryColor }}
                >
                  {fundraiser.photoUrl ? (
                    <img
                      src={fundraiser.photoUrl}
                      alt={fundraiser.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${fundraiser.firstName[0]}${fundraiser.lastName[0]}`
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{fundraiser.title}</h1>
                  <p className="text-gray-400 mt-1">
                    par <span className="text-white">{fundraiser.firstName} {fundraiser.lastName}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Pour la campagne{" "}
                    <span className="text-pink-400">{fundraiser.campaign.name}</span>
                  </p>
                  {fundraiser.team && (
                    <p className="text-sm text-purple-400 mt-1">
                      Équipe: {fundraiser.team.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Story */}
            {fundraiser.story && (
              <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-4">Mon histoire</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {fundraiser.story}
                </p>
              </div>
            )}

            {/* Video */}
            {fundraiser.videoUrl && (
              <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-4">Vidéo</h2>
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-900">
                  <iframe
                    src={fundraiser.videoUrl.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Recent Donations */}
            <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Donateurs récents ({fundraiser.donations.length})
              </h2>
              {fundraiser.donations.length > 0 ? (
                <div className="space-y-4">
                  {fundraiser.donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {donation.isAnonymous ? "?" : (donation.donorName?.[0] || "D")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">
                            {donation.isAnonymous ? "Donateur anonyme" : donation.donorName}
                          </p>
                          <p className="text-green-400 font-bold">
                            {donation.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                          </p>
                        </div>
                        {donation.message && (
                          <p className="text-sm text-gray-400 mt-1">&quot;{donation.message}&quot;</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(donation.createdAt).toLocaleDateString("fr-CA")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Soyez le premier à faire un don !</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Donation Widget */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-6 border border-slate-700 sticky top-4">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-green-400">
                  {fundraiser.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                </p>
                <p className="text-gray-400">
                  collectés sur{" "}
                  <span className="text-white">
                    {fundraiser.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}
                  </span>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all"
                    style={{ width: `${Math.min(fundraiser.progressPercent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-pink-400">{fundraiser.progressPercent.toFixed(0)}%</span>
                  <span className="text-gray-400">{fundraiser.donorCount} donateurs</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{fundraiser.donorCount}</p>
                  <p className="text-xs text-gray-400">Donateurs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{fundraiser.donationCount}</p>
                  <p className="text-xs text-gray-400">Dons</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{fundraiser.points}</p>
                  <p className="text-xs text-gray-400">Points</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowDonateModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Faire un don
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Partager
                </button>
              </div>

              {/* Badges */}
              {fundraiser.badges.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-sm text-gray-400 mb-3">Badges obtenus</p>
                  <div className="flex flex-wrap gap-2">
                    {fundraiser.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Propulsé par <span className="text-pink-400">Nucleus Cause</span></p>
        </div>
      </footer>

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700">
            {donated ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Merci !</h2>
                <p className="text-gray-400 mb-6">
                  Votre don de {donationAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} a été reçu.
                </p>
                <button
                  onClick={() => {
                    setShowDonateModal(false);
                    setDonated(false);
                    setDonorName("");
                    setDonorEmail("");
                    setDonorMessage("");
                  }}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Faire un don</h2>
                  <button
                    onClick={() => setShowDonateModal(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleDonate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Montant du don
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[25, 50, 100, 250].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDonationAmount(amount)}
                          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                            donationAmount === amount
                              ? "bg-pink-500 text-white"
                              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                          }`}
                        >
                          {amount}$
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="5"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Votre nom
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      disabled={isAnonymous}
                      placeholder="Jean Tremblay"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required
                      placeholder="jean@exemple.com"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message (optionnel)
                    </label>
                    <textarea
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      placeholder="Un mot d'encouragement..."
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-pink-500 focus:ring-pink-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-300">
                      Don anonyme
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={donating || !donorEmail || donationAmount < 5}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {donating ? "Traitement..." : `Donner ${donationAmount}$`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Partager</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-6 h-6 text-white" />
                <span className="text-xs text-gray-300">Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-xl hover:bg-sky-500 transition-colors"
              >
                <Twitter className="w-6 h-6 text-white" />
                <span className="text-xs text-gray-300">Twitter</span>
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Linkedin className="w-6 h-6 text-white" />
                <span className="text-xs text-gray-300">LinkedIn</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`}
                className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-xl hover:bg-pink-600 transition-colors"
              >
                <Mail className="w-6 h-6 text-white" />
                <span className="text-xs text-gray-300">Email</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              />
              <button
                onClick={copyLink}
                className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
