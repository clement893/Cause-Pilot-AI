/**
 * Script pour renommer une organisation
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/rename-organization.ts "TEST 2" "Fondation des Amis"
 */

import { PrismaClient } from '@prisma/client';

const MAIN_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway';

const prisma = new PrismaClient({
  datasources: { db: { url: MAIN_DATABASE_URL } },
});

const oldName = process.argv[2] || 'TEST 2';
const newName = process.argv[3] || 'Fondation des Amis';

async function renameOrganization() {
  console.log(`🔧 Renommage de l'organisation "${oldName}" en "${newName}"\n`);

  try {
    // Trouver l'organisation
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { name: { equals: oldName, mode: 'insensitive' } },
          { slug: { contains: oldName.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!organization) {
      console.log('❌ Organisation non trouvée');
      console.log('\n📋 Organisations disponibles:');
      const allOrgs = await prisma.organization.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { createdAt: 'asc' },
      });
      allOrgs.forEach(org => {
        console.log(`   - ${org.name} (${org.slug}): ${org.id}`);
      });
      return;
    }

    console.log(`✅ Organisation trouvée:`);
    console.log(`   ID: ${organization.id}`);
    console.log(`   Nom actuel: ${organization.name}`);
    console.log(`   Slug actuel: ${organization.slug}`);
    console.log('');

    // Générer un nouveau slug basé sur le nouveau nom
    const newSlug = newName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Vérifier si le slug existe déjà
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: newSlug },
      select: { id: true, name: true },
    });

    if (existingOrg && existingOrg.id !== organization.id) {
      console.log(`⚠️  Le slug "${newSlug}" existe déjà pour l'organisation "${existingOrg.name}"`);
      console.log(`   Utilisation du slug: ${newSlug}-${organization.id.slice(0, 8)}`);
      const uniqueSlug = `${newSlug}-${organization.id.slice(0, 8)}`;
      
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          name: newName,
          slug: uniqueSlug,
        },
      });
      
      console.log(`✅ Organisation renommée:`);
      console.log(`   Nouveau nom: ${newName}`);
      console.log(`   Nouveau slug: ${uniqueSlug}`);
    } else {
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          name: newName,
          slug: newSlug,
        },
      });
      
      console.log(`✅ Organisation renommée:`);
      console.log(`   Nouveau nom: ${newName}`);
      console.log(`   Nouveau slug: ${newSlug}`);
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

renameOrganization()
  .catch((error) => {
    console.error('❌ Échec:', error);
    process.exit(1);
  });
