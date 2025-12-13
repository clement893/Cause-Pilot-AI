"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Shield, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await signIn("google", { callbackUrl: "/super-admin" });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/super-admin",
        redirect: false,
      });

      if (result?.error) {
        setLoginError("Email ou mot de passe incorrect");
        setIsLoading(false);
      } else if (result?.ok) {
        window.location.href = "/super-admin";
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setLoginError("Une erreur est survenue lors de la connexion");
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "AccessDenied":
        return "Accès refusé. Seuls les utilisateurs du domaine nukleo.com peuvent accéder à cette zone.";
      case "OAuthAccountNotLinked":
        return "Ce compte est déjà lié à une autre méthode de connexion.";
      case "OAuthSignin":
      case "OAuthCallback":
        return "Erreur lors de la connexion avec Google. Veuillez réessayer.";
      default:
        return error ? "Une erreur est survenue. Veuillez réessayer." : null;
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

          {/* Sélecteur de méthode de connexion */}
          <div className="mb-6 flex gap-2 bg-slate-700/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginMethod("google")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === "google"
                  ? "bg-purple-500 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod("email")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === "email"
                  ? "bg-purple-500 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Email / Mot de passe
            </button>
          </div>

          {/* Formulaire Google */}
          {loginMethod === "google" && (
            <>
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

              {/* Info domaine pour Google */}
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-300">
                      Accès restreint
                    </p>
                    <p className="text-xs text-purple-400 mt-1">
                      Pour les administrateurs généraux, seuls les utilisateurs avec une adresse email @nukleo.com peuvent accéder.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Formulaire Email / Mot de passe */}
          {loginMethod === "email" && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>

              {/* Info pour Email/Mot de passe */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Connexion pour membres d&apos;organisation
                    </p>
                    <p className="text-xs text-blue-400 mt-1">
                      Les membres d&apos;organisation peuvent se connecter avec leur email et mot de passe. Tous les domaines sont autorisés.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
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
