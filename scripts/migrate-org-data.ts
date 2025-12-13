/**
 * Script pour migrer les données d'une organisation vers une base de données dédiée
 * 
 * Usage:
 *   npx tsx scripts/migrate-org-data.ts <org-id> <target-database-url>
 * 
 * Exemple:
 *   npx tsx scripts/migrate-org-data.ts cmj2vva8a0000fonjcrijii9b postgresql://user:pass@host:port/org1_db
 */

import { PrismaClient } from '@prisma/client';

const mainDatabaseUrl = process.env.DATABASE_URL;
if (!mainDatabaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const organizationId = process.argv[2];
const targetDatabaseUrl = process.argv[3];

if (!organizationId || !targetDatabaseUrl) {
  console.error('❌ Usage: npx tsx scripts/migrate-org-data.ts <org-id> <target-database-url>');
  console.error('');
  console.error('Exemple:');
  console.error('  npx tsx scripts/migrate-org-data.ts cmj2vva8a0000fonjcrijii9b postgresql://user:pass@host:port/org1_db');
  process.exit(1);
}

const mainPrisma = new PrismaClient({
  datasources: { db: { url: mainDatabaseUrl } },
});

async function migrateOrganizationData() {
  console.log(`🔄 Migration des données pour l'organisation ${organizationId}...`);
  console.log(`📊 Base source: ${mainDatabaseUrl}`);
  console.log(`🎯 Base cible: ${targetDatabaseUrl}`);
  console.log('');

  // Vérifier que l'organisation existe
  const organization = await mainPrisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, slug: true },
  });

  if (!organization) {
    console.error(`❌ Organisation ${organizationId} non trouvée`);
    process.exit(1);
  }

  console.log(`✅ Organisation trouvée: ${organization.name} (${organization.slug})`);
  console.log('');

  // Créer un client Prisma pour la base cible
  const targetPrisma = new PrismaClient({
    datasources: { db: { url: targetDatabaseUrl } },
  });

  try {
    // Test de connexion à la base cible
    await targetPrisma.$connect();
    console.log('✅ Connexion à la base cible réussie');
    console.log('');

    // 1. Migrer les donateurs
    console.log('📋 Migration des donateurs...');
    const donors = await mainPrisma.donor.findMany({
      where: { organizationId },
      include: {
        DonorPreference: true,
        DonorCustomField: true,
      },
    });

    console.log(`   ${donors.length} donateurs trouvés`);

    let donorCount = 0;
    for (const donor of donors) {
      const { DonorPreference, DonorCustomField, id, createdAt, updatedAt, ...donorData } = donor;
      
      try {
        await targetPrisma.donor.create({
          data: {
            ...donorData,
            DonorPreference: DonorPreference ? {
              create: {
                preferredChannel: DonorPreference.preferredChannel,
                preferredFrequency: DonorPreference.preferredFrequency,
                preferredLanguage: DonorPreference.preferredLanguage,
                causesOfInterest: DonorPreference.causesOfInterest,
                preferredAmount: DonorPreference.preferredAmount,
                preferredPaymentMethod: DonorPreference.preferredPaymentMethod,
                birthday: DonorPreference.birthday,
                anniversary: DonorPreference.anniversary,
              },
            } : undefined,
            DonorCustomField: DonorCustomField.length > 0 ? {
              create: DonorCustomField.map(field => ({
                value: field.value,
                fieldId: field.fieldId,
              })),
            } : undefined,
          },
        });
        donorCount++;
      } catch (error: any) {
        console.error(`   ⚠️  Erreur lors de la migration du donateur ${donor.email}:`, error.message);
      }
    }

    console.log(`   ✅ ${donorCount}/${donors.length} donateurs migrés`);
    console.log('');

    // 2. Migrer les dons
    console.log('💰 Migration des dons...');
    const donations = await mainPrisma.donation.findMany({
      where: { 
        donorId: { in: donors.map(d => d.id) }
      },
    });

    console.log(`   ${donations.length} dons trouvés`);

    let donationCount = 0;
    for (const donation of donations) {
      try {
        const { id, createdAt, updatedAt, ...donationData } = donation;
        await targetPrisma.donation.create({
          data: donationData,
        });
        donationCount++;
      } catch (error: any) {
        console.error(`   ⚠️  Erreur lors de la migration du don ${donation.id}:`, error.message);
      }
    }

    console.log(`   ✅ ${donationCount}/${donations.length} dons migrés`);
    console.log('');

    // 3. Récupérer les campagnes de l'organisation (pour les formulaires et migration)
    const campaigns = await mainPrisma.campaign.findMany({
      where: { organizationId },
    });
    const campaignIds = campaigns.map(c => c.id);
    
    // Migrer les formulaires de don (via les campagnes de l'organisation)
    console.log('📝 Migration des formulaires...');
    const forms = await mainPrisma.donationForm.findMany({
      where: campaignIds.length > 0 ? {
        campaignId: { in: campaignIds },
      } : {
        id: 'no-forms', // Condition impossible si pas de campagnes
      },
      include: {
        FormField: true,
      },
    });

    console.log(`   ${forms.length} formulaires trouvés`);

    let formCount = 0;
    for (const form of forms) {
      const { FormField, id, createdAt, updatedAt, ...formData } = form;
      try {
        await targetPrisma.donationForm.create({
          data: {
            ...formData,
            FormField: FormField.length > 0 ? {
              create: FormField.map(field => ({
                label: field.label,
                type: field.type,
                required: field.required,
                order: field.order,
                options: field.options,
                placeholder: field.placeholder,
                defaultValue: field.defaultValue,
              })),
            } : undefined,
          },
        });
        formCount++;
      } catch (error: any) {
        console.error(`   ⚠️  Erreur lors de la migration du formulaire ${form.id}:`, error.message);
      }
    }

    console.log(`   ✅ ${formCount}/${forms.length} formulaires migrés`);
    console.log('');

    // 4. Migrer les campagnes (déjà récupérées ci-dessus)
    console.log('📧 Migration des campagnes...');

    console.log(`   ${campaigns.length} campagnes trouvées`);

    let campaignCount = 0;
    for (const campaign of campaigns) {
      try {
        const { id, createdAt, updatedAt, ...campaignData } = campaign;
        await targetPrisma.campaign.create({
          data: campaignData,
        });
        campaignCount++;
      } catch (error: any) {
        console.error(`   ⚠️  Erreur lors de la migration de la campagne ${campaign.id}:`, error.message);
      }
    }

    console.log(`   ✅ ${campaignCount}/${campaigns.length} campagnes migrées`);
    console.log('');

    console.log('✅ Migration terminée avec succès!');
    console.log('');
    console.log('📊 Résumé:');
    console.log(`   - Donateurs: ${donorCount}/${donors.length}`);
    console.log(`   - Dons: ${donationCount}/${donations.length}`);
    console.log(`   - Formulaires: ${formCount}/${forms.length}`);
    console.log(`   - Campagnes: ${campaignCount}/${campaigns.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await targetPrisma.$disconnect();
  }
}

migrateOrganizationData()
  .catch((error) => {
    console.error('❌ Migration échouée:', error);
    process.exit(1);
  })
  .finally(() => {
    mainPrisma.$disconnect();
  });
