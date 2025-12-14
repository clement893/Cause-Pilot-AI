"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Shield, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      // Utiliser redirect: false pour capturer les erreurs
      const result = await signIn("google", { 
        callbackUrl: "/super-admin",
        redirect: false,
      });
      
      if (result?.error) {
        console.error("Erreur de connexion Google:", result.error);
        if (result.error === "Configuration") {
          setLoginError("Le provider Google OAuth n'est pas configuré. Vérifiez les logs Railway pour plus de détails.");
        } else {
          setLoginError(`Erreur lors de la connexion: ${result.error}`);
        }
        setIsLoading(false);
      } else if (result?.ok) {
        // Redirection manuelle si redirect: false
        window.location.href = "/super-admin";
      } else {
        // Pas de résultat, essayer la redirection normale
        await signIn("google", { 
          callbackUrl: "/super-admin",
        });
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setLoginError("Une erreur est survenue lors de la connexion avec Google.");
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "Erreur de configuration: Les variables d'environnement Google OAuth ne sont pas configurées. Veuillez vérifier GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sur Railway.";
      case "AccessDenied":
        return "Accès refusé. Seuls les utilisateurs du domaine nukleo.com peuvent accéder à cette zone.";
      case "OAuthAccountNotLinked":
        return "Ce compte est déjà lié à une autre méthode de connexion.";
      case "OAuthSignin":
      case "OAuthCallback":
        return "Erreur lors de la connexion avec Google. Veuillez réessayer.";
      case "CredentialsSignin":
        return "Erreur d'authentification. Veuillez réessayer.";
      default:
        return error ? `Une erreur est survenue: ${error}. Veuillez réessayer ou contacter le support.` : null;
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Super Admin
          </h1>
          <p className="text-slate-400">
            Espace d&apos;administration Cause Pilot AI
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          {/* Message d'erreur */}
          {(errorMessage || loginError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{errorMessage || loginError}</p>
            </div>
          )}

          {/* Bouton Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoading ? "Connexion..." : "Continuer avec Google"}</span>
          </button>

          {/* Info domaine */}
          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-300">
                  Accès restreint
                </p>
                <p className="text-xs text-purple-400 mt-1">
                  Seuls les utilisateurs avec une adresse email @nukleo.com peuvent accéder à cet espace super admin.
                </p>
              </div>
            </div>
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

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
