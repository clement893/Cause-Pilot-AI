-- Migration: Add databaseUrl field to Organization table
-- This allows each organization to have its own dedicated database

-- Add the databaseUrl column (nullable, optional)
ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "databaseUrl" TEXT;

-- Add a comment to explain the field
COMMENT ON COLUMN "Organization"."databaseUrl" IS 'URL of the dedicated database for this organization. NULL means using the shared database with organizationId filtering.';

-- Create an index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS "Organization_databaseUrl_idx" ON "Organization"("databaseUrl") WHERE "databaseUrl" IS NOT NULL;
