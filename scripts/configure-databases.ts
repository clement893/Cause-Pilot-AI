/**
 * Script pour configurer les URLs de base de données pour les organisations
 * 
 * Usage:
 *   npx tsx scripts/configure-databases.ts
 * 
 * Ce script vous guide interactivement pour configurer les bases de données
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function configureDatabases() {
  console.log('🔧 Configuration des bases de données par organisation\n');

  // Récupérer toutes les organisations
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true, databaseUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  if (organizations.length === 0) {
    console.log('❌ Aucune organisation trouvée');
    rl.close();
    return;
  }

  console.log('📋 Organisations trouvées:\n');
  organizations.forEach((org, index) => {
    const hasDb = org.databaseUrl ? '✅' : '❌';
    console.log(`   ${index + 1}. ${org.name} (${org.slug})`);
    console.log(`      ID: ${org.id}`);
    console.log(`      Base de données: ${hasDb} ${org.databaseUrl || 'Non configurée'}`);
    console.log('');
  });

  for (const org of organizations) {
    console.log(`\n🔧 Configuration pour: ${org.name} (${org.slug})`);
    
    const action = await question(
      `   Action [s]auter, [c]onfigurer, [r]etirer la base dédiée, [a]fficher: `
    );

    if (action.toLowerCase() === 's' || action === '') {
      console.log('   ⏭️  Sauté\n');
      continue;
    }

    if (action.toLowerCase() === 'r') {
      await prisma.organization.update({
        where: { id: org.id },
        data: { databaseUrl: null },
      });
      console.log('   ✅ Base dédiée retirée, utilisation de la base partagée\n');
      continue;
    }

    if (action.toLowerCase() === 'a') {
      console.log(`   📊 URL actuelle: ${org.databaseUrl || 'Non configurée'}\n`);
      continue;
    }

    if (action.toLowerCase() === 'c') {
      const databaseUrl = await question('   Entrez l\'URL de la base de données (ou Enter pour annuler): ');
      
      if (!databaseUrl || databaseUrl.trim() === '') {
        console.log('   ⏭️  Annulé\n');
        continue;
      }

      // Valider le format de l'URL
      if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
        console.log('   ⚠️  L\'URL doit commencer par postgresql:// ou postgres://');
        const confirm = await question('   Continuer quand même? [o/N]: ');
        if (confirm.toLowerCase() !== 'o') {
          console.log('   ⏭️  Annulé\n');
          continue;
        }
      }

      try {
        await prisma.organization.update({
          where: { id: org.id },
          data: { databaseUrl: databaseUrl.trim() },
        });
        console.log('   ✅ Base de données configurée avec succès\n');
      } catch (error: any) {
        console.error(`   ❌ Erreur: ${error.message}\n`);
      }
    }
  }

  console.log('\n✅ Configuration terminée!\n');

  // Afficher le résumé
  const updatedOrgs = await prisma.organization.findMany({
    select: { name: true, slug: true, databaseUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('📊 Résumé de la configuration:\n');
  updatedOrgs.forEach((org) => {
    const status = org.databaseUrl ? '✅ Base dédiée' : '📦 Base partagée';
    console.log(`   - ${org.name}: ${status}`);
    if (org.databaseUrl) {
      // Masquer les credentials dans l'affichage
      const maskedUrl = org.databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
      console.log(`     ${maskedUrl}`);
    }
  });
}

configureDatabases()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
    prisma.$disconnect();
  });
