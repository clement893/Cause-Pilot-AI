"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SqlResult {
  success: boolean;
  data?: unknown;
  rowCount?: number;
  message?: string;
  error?: string;
  details?: string;
}

export default function SqlClientPage() {
  const [query, setQuery] = useState(`-- Exemple : Créer la table AdminInvitation
DO $$ BEGIN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "AdminInvitation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "invitedBy" TEXT NOT NULL,
    "invitedByName" TEXT,
    "role" TEXT,
    "organizationId" TEXT,
    CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminInvitation_email_idx" ON "AdminInvitation"("email");
CREATE INDEX IF NOT EXISTS "AdminInvitation_status_idx" ON "AdminInvitation"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminInvitation_token_key" ON "AdminInvitation"("token");
CREATE INDEX IF NOT EXISTS "AdminInvitation_invitedBy_idx" ON "AdminInvitation"("invitedBy");

DO $$ BEGIN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  
  const [result, setResult] = useState<SqlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [allowDangerous, setAllowDangerous] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({
        success: false,
        error: "Veuillez entrer une requête SQL",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/super-admin/sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query,
          allowDangerous,
        }),
      });

      const data: SqlResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Erreur lors de l&apos;exécution de la requête",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    {
      name: "Vérifier si AdminInvitation existe",
      query: `SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'AdminInvitation'
);`,
    },
    {
      name: "Lister toutes les tables",
      query: `SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;`,
    },
    {
      name: "Compter les invitations",
      query: `SELECT COUNT(*) as count FROM "AdminInvitation";`,
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Client SQL</h1>
        <p className="text-gray-600">
          Exécutez des requêtes SQL directement sur la base de données. Accès réservé aux super admins.
        </p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Attention :</strong> Cette interface permet d&apos;exécuter du SQL directement. 
          Utilisez-la avec précaution. Les opérations destructives nécessitent une confirmation explicite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Requête SQL
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-96 font-mono text-sm border rounded p-4"
                placeholder="Entrez votre requête SQL ici..."
              />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowDangerous}
                  onChange={(e) => setAllowDangerous(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-red-600">
                  Autoriser les opérations dangereuses (DROP, TRUNCATE, DELETE)
                </span>
              </label>
            </div>

            <Button
              onClick={executeQuery}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Exécution..." : "Exécuter la requête"}
            </Button>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Requêtes rapides</h2>
            <div className="space-y-2">
              {quickQueries.map((quickQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(quickQuery.query)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                >
                  {quickQuery.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-6">
          <div
            className={`rounded-lg p-6 ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h3 className={`font-semibold mb-2 ${
              result.success ? "text-green-800" : "text-red-800"
            }`}>
              {result.success ? "✅ Succès" : "❌ Erreur"}
            </h3>

            {result.success ? (
              <div>
                {result.message && (
                  <p className="text-green-700 mb-2">{result.message}</p>
                )}
                {result.rowCount !== undefined && (
                  <p className="text-green-700 mb-2">
                    {result.rowCount} ligne(s) retournée(s)
                  </p>
                )}
                {result.data !== undefined && result.data !== null && (
                  <div className="mt-4">
                    <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-red-700 mb-2">{result.error}</p>
                {result.details && (
                  <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs text-red-600">
                    {result.details}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

