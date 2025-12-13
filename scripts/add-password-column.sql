-- Ajouter la colonne password à la table AdminUser
-- Cette colonne est optionnelle : null pour les admins généraux (utilisent Google OAuth)
-- Remplie pour les membres d'organisation (utilisent email/mot de passe)

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN "AdminUser"."password" IS 'Mot de passe hashé (optionnel, pour les membres d''organisation)';

