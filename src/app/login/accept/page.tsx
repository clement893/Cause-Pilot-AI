"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, Mail, CheckCircle, XCircle, Loader2, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";

interface InvitationData {
  email: string;
  role: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  invitedBy: {
    name: string | null;
    email: string;
  } | null;
  expiresAt: string;
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchInvitation = useCallback(async () => {
    try {
      const response = await fetch(`/api/super-admin/invite/accept?token=${token}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setInvitation(data.data);
      } else {
        setError(data.error || "Erreur lors de la récupération de l&apos;invitation");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la récupération de l&apos;invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Token d'invitation manquant");
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token, fetchInvitation]);

  const handleAccept = async () => {
    if (!token) return;

    // Pour les invitations d&apos;organisation, le mot de passe est requis
    if (!password) {
      setError("Le mot de passe est requis");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setAccepting(true);
    setError(null);
    try {
      const response = await fetch("/api/super-admin/invite/accept", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Erreur lors de l&apos;acceptation de l&apos;invitation");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de l&apos;acceptation de l&apos;invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
              <p className="text-red-400 mb-6">{error}</p>
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Invitation acceptée !</h1>
              <p className="text-slate-300 mb-6">
                Votre invitation a été acceptée avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
              >
                Aller à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Accepter l&apos;invitation
          </h1>
          <p className="text-slate-400">
            Rejoignez votre organisation sur Cause Pilot AI
          </p>
        </div>

        {/* Carte d&apos;invitation */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          {/* Info invitation */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm text-slate-300">{invitation.email}</p>
              </div>
            </div>

            {invitation.organization && (
              <div className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl">
                <Building2 className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Organisation</p>
                  <p className="text-sm text-slate-300">{invitation.organization.name}</p>
                </div>
              </div>
            )}

            {invitation.invitedBy && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-400">
                  Invité par: {invitation.invitedBy.name || invitation.invitedBy.email}
                </p>
              </div>
            )}
          </div>

          {/* Formulaire de mot de passe */}
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Créer un mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 8 caractères"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Répétez le mot de passe"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Acceptation...</span>
                </>
              ) : (
                <span>Accepter l&apos;invitation</span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Cause Pilot AI © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
