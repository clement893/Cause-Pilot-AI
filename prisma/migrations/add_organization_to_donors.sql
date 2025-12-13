-- Migration: Ajouter organizationId aux donateurs
-- Date: 2025-12-13

-- Étape 1: Ajouter la colonne organizationId (nullable pour permettre la migration progressive)
ALTER TABLE "Donor" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Étape 2: Créer l'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "Donor_organizationId_idx" ON "Donor"("organizationId");

-- Étape 3: Ajouter la contrainte de clé étrangère
-- Note: Cette étape nécessite que la table Organization existe déjà
-- Si vous avez déjà des organisations, vous pouvez lier les donateurs à la première organisation
-- ALTER TABLE "Donor" ADD CONSTRAINT "Donor_organizationId_fkey" 
--   FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Étape 4 (Optionnel): Lier les donateurs existants à une organisation par défaut
-- Remplacez 'YOUR_DEFAULT_ORG_ID' par l'ID de votre organisation par défaut
-- UPDATE "Donor" SET "organizationId" = 'YOUR_DEFAULT_ORG_ID' WHERE "organizationId" IS NULL;

-- Note: Après avoir exécuté cette migration, vous devrez:
-- 1. Lier manuellement les donateurs existants aux organisations appropriées
-- 2. Ou créer un script de migration pour les lier automatiquement
