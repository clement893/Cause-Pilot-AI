"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Building2, Mail, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
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

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setError("Token d&apos;invitation manquant");
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token, fetchInvitation]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const response = await fetch("/api/super-admin/invite/accept", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push("/super-admin/login");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l&apos;invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-red-500/20 p-8">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
              <p className="text-red-400 mb-6">{error}</p>
              <Link
                href="/super-admin/login"
                className="inline-block px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Invitation acceptée !</h1>
              <p className="text-slate-400 mb-6">
                Votre invitation a été acceptée avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
              <Link
                href="/super-admin/login"
                className="inline-block px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
              >
                Se connecter maintenant
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Accepter l&apos;invitation
          </h1>
          <p className="text-slate-400">
            CausePilot AI - Administration
          </p>
        </div>

        {/* Carte d'invitation */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          {/* Info invitation */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-300">Email invité</p>
                <p className="text-sm text-slate-300">{invitation.email}</p>
              </div>
            </div>

            {invitation.organization ? (
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-300">Organisation</p>
                  <p className="text-sm text-slate-300">{invitation.organization.name}</p>
                </div>
              </div>
            ) : (
              invitation.role && (
                <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-300">Rôle</p>
                    <p className="text-sm text-slate-300">{invitation.role}</p>
                  </div>
                </div>
              )
            )}

            {invitation.invitedBy && (
              <div className="p-4 bg-slate-700/50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Invité par</p>
                <p className="text-sm text-slate-300">
                  {invitation.invitedBy.name || invitation.invitedBy.email}
                </p>
              </div>
            )}
          </div>

          {/* Avertissement */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-300">
                Important
              </p>
              <p className="text-xs text-yellow-400 mt-1">
                Vous devez vous connecter avec un compte Google utilisant l&apos;adresse email <strong>{invitation.email}</strong>.
              </p>
            </div>
          </div>

          {/* Bouton d'acceptation */}
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Acceptation...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accepter l&apos;invitation
              </>
            )}
          </button>

          {/* Lien de connexion */}
          <div className="mt-4 text-center">
            <Link
              href="/super-admin/login"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Se connecter directement
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          CausePilot AI © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

