/**
 * Script pour ajouter la colonne databaseUrl à la table Organization
 */

import { PrismaClient } from '@prisma/client';

const MAIN_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway';

const prisma = new PrismaClient({
  datasources: { db: { url: MAIN_DATABASE_URL } },
});

async function addDatabaseUrlColumn() {
  console.log('🔧 Ajout de la colonne databaseUrl à la table Organization\n');

  try {
    // Exécuter la migration SQL directement
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Organization" 
      ADD COLUMN IF NOT EXISTS "databaseUrl" TEXT;
    `);

    console.log('✅ Colonne databaseUrl ajoutée avec succès');

    // Créer l'index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Organization_databaseUrl_idx" 
      ON "Organization"("databaseUrl") 
      WHERE "databaseUrl" IS NOT NULL;
    `);

    console.log('✅ Index créé avec succès');
    console.log('');

    // Régénérer le client Prisma pour inclure le nouveau champ
    console.log('🔄 Régénération du client Prisma...');
    console.log('   Exécutez: npx prisma generate');
    console.log('');

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✅ La colonne databaseUrl existe déjà');
    } else {
      console.error('❌ Erreur:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addDatabaseUrlColumn()
  .catch((error) => {
    console.error('❌ Échec:', error);
    process.exit(1);
  });
