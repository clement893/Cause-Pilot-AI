"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PromotePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const promote = async () => {
      try {
        const response = await fetch("/api/super-admin/promote", {
          method: "POST",
        });
        const data = await response.json();
        
        if (data.success) {
          setStatus("success");
          setMessage(`Succès ! Vous êtes maintenant ${data.user.role}`);
          // Rediriger vers les organisations après 2 secondes
          setTimeout(() => {
            router.push("/super-admin/organizations");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Erreur inconnue");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Erreur de connexion");
        console.error(error);
      }
    };

    promote();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md">
        {status === "loading" && (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-white">Promotion en cours...</h1>
            <p className="text-slate-400 mt-2">Veuillez patienter</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">{message}</h1>
            <p className="text-slate-400 mt-2">Redirection vers les organisations...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Erreur</h1>
            <p className="text-red-400 mt-2">{message}</p>
            <button
              onClick={() => router.push("/super-admin")}
              className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  );
}
