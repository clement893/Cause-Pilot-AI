// Script pour créer la table AdminInvitation directement dans la base de données
// Usage: node scripts/create-table-direct.js

const { Client } = require('pg');

const DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');

    // Créer l'enum InvitationStatus
    console.log('📝 Création de l\'enum InvitationStatus...');
    await client.query(`
      DO $$ BEGIN
          CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enum créé');

    // Créer la table AdminInvitation
    console.log('📝 Création de la table AdminInvitation...');
    await client.query(`
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
    `);
    console.log('✅ Table créée');

    // Créer les index
    console.log('📝 Création des index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "AdminInvitation_email_idx" ON "AdminInvitation"("email");
      CREATE INDEX IF NOT EXISTS "AdminInvitation_status_idx" ON "AdminInvitation"("status");
      CREATE UNIQUE INDEX IF NOT EXISTS "AdminInvitation_token_key" ON "AdminInvitation"("token");
      CREATE INDEX IF NOT EXISTS "AdminInvitation_invitedBy_idx" ON "AdminInvitation"("invitedBy");
    `);
    console.log('✅ Index créés');

    // Ajouter les contraintes de clé étrangère
    console.log('📝 Ajout des contraintes de clé étrangère...');
    await client.query(`
      DO $$ BEGIN
          ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
          ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Contraintes ajoutées');

    // Vérifier que la table existe
    const result = await client.query('SELECT COUNT(*) as count FROM "AdminInvitation"');
    console.log(`✅ Table AdminInvitation créée avec succès! (${result.rows[0].count} invitations)`);

    await client.end();
    console.log('✅ Connexion fermée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    await client.end();
    process.exit(1);
  }
}

createTable();

