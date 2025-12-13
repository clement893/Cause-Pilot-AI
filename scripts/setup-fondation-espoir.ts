/**
 * Script pour configurer la base de données de la Fondation Espoir
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/setup-fondation-espoir.ts
 * 
 * Ou avec la base principale par défaut:
 *   npx tsx scripts/setup-fondation-espoir.ts
 */

import { PrismaClient } from '@prisma/client';

const MAIN_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway';
const FONDATION_ESPOIR_DB_URL = 'postgresql://postgres:PZNbZRVqoAhbZntcsLvzDCSdYfnBVJIS@yamabiko.proxy.rlwy.net:10198/railway';

const prisma = new PrismaClient({
  datasources: { db: { url: MAIN_DATABASE_URL } },
});

async function setupFondationEspoir() {
  console.log('🔧 Configuration de la base de données pour Fondation Espoir\n');

  try {
    // 1. Trouver l'organisation Fondation Espoir
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: 'Espoir', mode: 'insensitive' } },
          { name: { contains: 'Fondation', mode: 'insensitive' } },
          { slug: { contains: 'espoir', mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true },
    });
    
    // Récupérer databaseUrl via SQL brut
    let currentDatabaseUrl: string | null = null;
    if (organizations.length > 0) {
      const dbUrlResult = await prisma.$queryRawUnsafe<Array<{ databaseUrl: string | null }>>(
        `SELECT "databaseUrl" FROM "Organization" WHERE id = $1`,
        organizations[0].id
      );
      currentDatabaseUrl = dbUrlResult[0]?.databaseUrl || null;
    }

    if (organizations.length === 0) {
      console.log('❌ Organisation "Fondation Espoir" non trouvée');
      console.log('\n📋 Organisations disponibles:');
      const allOrgs = await prisma.organization.findMany({
        select: { id: true, name: true, slug: true },
      });
      allOrgs.forEach(org => {
        console.log(`   - ${org.name} (${org.slug}): ${org.id}`);
      });
      return;
    }

    const org = organizations[0];
    console.log(`✅ Organisation trouvée: ${org.name} (${org.slug})`);
    console.log(`   ID: ${org.id}`);
    console.log(`   Base actuelle: ${currentDatabaseUrl || 'Non configurée (base partagée)'}`);
    console.log('');

    // 2. Tester la connexion à la nouvelle base
    console.log('🔌 Test de connexion à la nouvelle base de données...');
    const testPrisma = new PrismaClient({
      datasources: { db: { url: FONDATION_ESPOIR_DB_URL } },
    });

    try {
      await testPrisma.$connect();
      console.log('✅ Connexion réussie à la base de données');
      
      // Vérifier si les tables existent
      const tableCount = await testPrisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Donor'
      `;
      
      if (tableCount[0].count > 0n) {
        console.log('✅ Les tables existent déjà dans la base');
      } else {
        console.log('⚠️  Les tables n\'existent pas encore - vous devrez exécuter les migrations');
      }
      
      await testPrisma.$disconnect();
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error.message);
      console.log('\n⚠️  Assurez-vous que:');
      console.log('   1. La base de données existe');
      console.log('   2. Les migrations Prisma ont été exécutées');
      console.log('   3. Les credentials sont corrects');
      return;
    }

    console.log('');

    // 3. Configurer l'URL dans la base principale
    console.log('📝 Configuration de l\'URL dans la base principale...');
    await prisma.$executeRawUnsafe(
      `UPDATE "Organization" SET "databaseUrl" = $1 WHERE id = $2`,
      FONDATION_ESPOIR_DB_URL,
      org.id
    );

    console.log('✅ URL configurée avec succès');
    console.log('');

    // 4. Vérifier la configuration
    const updatedResult = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; databaseUrl: string | null }>>(
      `SELECT id, name, "databaseUrl" FROM "Organization" WHERE id = $1`,
      org.id
    );
    const updated = updatedResult[0];

    console.log('📊 Configuration finale:');
    console.log(`   Organisation: ${updated?.name}`);
    console.log(`   ID: ${updated?.id}`);
    console.log(`   Base de données: ${updated?.databaseUrl ? '✅ Configurée' : '❌ Non configurée'}`);
    if (updated?.databaseUrl) {
      // Masquer les credentials dans l'affichage
      const maskedUrl = updated.databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
      console.log(`   URL: ${maskedUrl}`);
    }
    console.log('');

    console.log('✅ Configuration terminée!');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Exécuter les migrations sur la nouvelle base:');
    console.log(`      DATABASE_URL="${FONDATION_ESPOIR_DB_URL}" npx prisma migrate deploy`);
    console.log('');
    console.log('   2. Migrer les données existantes (si nécessaire):');
    console.log(`      npx tsx scripts/migrate-org-data.ts ${org.id} "${FONDATION_ESPOIR_DB_URL}"`);
    console.log('');
    console.log('   3. Activer le mode multi-bases dans Railway:');
    console.log('      Ajouter: ENABLE_MULTI_DATABASE=true');
    console.log('');
    console.log('   4. Redéployer l\'application');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupFondationEspoir()
  .catch((error) => {
    console.error('❌ Échec de la configuration:', error);
    process.exit(1);
  });
