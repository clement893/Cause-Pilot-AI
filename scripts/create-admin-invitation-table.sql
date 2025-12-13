-- Script SQL pour créer la table AdminInvitation si elle n'existe pas
-- Exécutez cette requête dans votre base de données PostgreSQL

-- Créer l'enum InvitationStatus s'il n'existe pas
DO $$ BEGIN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer la table AdminInvitation
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

-- Créer les index
CREATE INDEX IF NOT EXISTS "AdminInvitation_email_idx" ON "AdminInvitation"("email");
CREATE INDEX IF NOT EXISTS "AdminInvitation_status_idx" ON "AdminInvitation"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminInvitation_token_key" ON "AdminInvitation"("token");
CREATE INDEX IF NOT EXISTS "AdminInvitation_invitedBy_idx" ON "AdminInvitation"("invitedBy");

-- Ajouter les contraintes de clé étrangère
DO $$ BEGIN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vérification
SELECT COUNT(*) as invitation_count FROM "AdminInvitation";

