-- Script SQL pour promouvoir clement@nukleo.com en SUPER_ADMIN
-- Exécutez cette requête dans votre base de données PostgreSQL

UPDATE "AdminUser" 
SET 
  role = 'SUPER_ADMIN',
  status = 'ACTIVE'
WHERE email = 'clement@nukleo.com';

-- Vérification
SELECT id, email, role, status, "createdAt"
FROM "AdminUser"
WHERE email = 'clement@nukleo.com';

