/**
 * Script de migration: Lier les donateurs existants à une organisation
 * 
 * Usage:
 * 1. Créez d'abord une organisation dans votre base de données
 * 2. Modifiez DEFAULT_ORG_ID ci-dessous avec l'ID de votre organisation
 * 3. Exécutez: npx tsx prisma/migrate-donors-to-org.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ID de l'organisation par défaut (à modifier)
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || "";

async function migrateDonorsToOrganization() {
  if (!DEFAULT_ORG_ID) {
    console.error("❌ DEFAULT_ORG_ID n'est pas défini. Veuillez définir la variable d'environnement ou modifier le script.");
    process.exit(1);
  }

  try {
    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: DEFAULT_ORG_ID },
    });

    if (!organization) {
      console.error(`❌ L'organisation avec l'ID "${DEFAULT_ORG_ID}" n'existe pas.`);
      process.exit(1);
    }

    console.log(`✅ Organisation trouvée: ${organization.name}`);

    // Compter les donateurs sans organisation
    const donorsWithoutOrg = await prisma.donor.count({
      where: { organizationId: null },
    });

    console.log(`📊 ${donorsWithoutOrg} donateur(s) sans organisation trouvé(s)`);

    if (donorsWithoutOrg === 0) {
      console.log("✅ Tous les donateurs sont déjà liés à une organisation.");
      return;
    }

    // Lier les donateurs à l'organisation
    const result = await prisma.donor.updateMany({
      where: { organizationId: null },
      data: { organizationId: DEFAULT_ORG_ID },
    });

    console.log(`✅ ${result.count} donateur(s) lié(s) à l'organisation "${organization.name}"`);

    // Vérifier le résultat
    const remaining = await prisma.donor.count({
      where: { organizationId: null },
    });

    if (remaining > 0) {
      console.warn(`⚠️  ${remaining} donateur(s) restent sans organisation.`);
    } else {
      console.log("✅ Tous les donateurs ont été migrés avec succès!");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateDonorsToOrganization()
  .then(() => {
    console.log("✅ Migration terminée");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration échouée:", error);
    process.exit(1);
  });
