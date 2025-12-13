/**
 * Script pour nettoyer la base de données principale en supprimant tous les donateurs
 * et leurs données associées
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... npx tsx scripts/clean-main-database.ts
 * 
 * ATTENTION: Cette opération est irréversible !
 */

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  DATABASE_URL=postgresql://... npx tsx scripts/clean-main-database.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function cleanMainDatabase() {
  console.log('🧹 Nettoyage de la base de données principale...');
  console.log(`📊 Base: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');

  try {
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion réussie');
    console.log('');

    // Compter les données avant suppression
    const donorCount = await prisma.donor.count();
    console.log(`📊 ${donorCount} donateurs trouvés`);
    
    if (donorCount === 0) {
      console.log('✅ Aucun donateur à supprimer. La base est déjà propre.');
      return;
    }

    // Helper pour les opérations sécurisées
    const safeCount = async (fn: () => Promise<number>) => {
      try {
        return await fn();
      } catch (error: any) {
        console.log(`   ⚠️  Erreur lors du comptage: ${error.message}`);
        return 0;
      }
    };

    const safeDelete = async (label: string, fn: () => Promise<any>) => {
      try {
        const result = await fn();
        console.log(`   ✅ ${label}`);
        return result;
      } catch (error: any) {
        console.log(`   ⚠️  Erreur lors de la suppression de ${label}: ${error.message}`);
        return null;
      }
    };

    const donationCount = await safeCount(() => prisma.donation.count());
    const formSubmissionCount = await safeCount(() => prisma.donationSubmission.count());
    const communicationCount = await safeCount(() => prisma.communication.count());
    const consentHistoryCount = await safeCount(() => prisma.consentHistory.count());
    const campaignDonorCount = await safeCount(() => prisma.campaignDonor.count());
    const segmentMembershipCount = await safeCount(() => prisma.donorSegmentMembership.count());
    const emailRecipientCount = await safeCount(() => prisma.emailRecipient.count({
      where: { donorId: { not: null } }
    }));
    const mailingListSubscriberCount = await safeCount(() => prisma.mailingListSubscriber.count({
      where: { donorId: { not: null } }
    }));
    const receiptCount = await safeCount(() => prisma.receipt.count({
      where: { donorId: { not: null } }
    }));

    console.log(`📊 Données associées:`);
    console.log(`   - ${donationCount} dons`);
    console.log(`   - ${formSubmissionCount} soumissions de formulaires`);
    console.log(`   - ${communicationCount} communications`);
    console.log(`   - ${consentHistoryCount} historiques de consentement`);
    console.log(`   - ${campaignDonorCount} relations campagne-donateur`);
    console.log(`   - ${segmentMembershipCount} membres de segments`);
    console.log(`   - ${emailRecipientCount} destinataires d'emails`);
    console.log(`   - ${mailingListSubscriberCount} abonnés aux listes`);
    console.log(`   - ${receiptCount} reçus`);
    console.log('');

    // Supprimer dans l'ordre inverse des dépendances
    console.log('🗑️  Suppression en cours...');
    console.log('');

    // 1. Supprimer les reçus liés aux donateurs
    if (receiptCount > 0) {
      console.log('   Suppression des reçus...');
      await safeDelete('Reçus supprimés', () => prisma.receipt.deleteMany({
        where: { donorId: { not: null } }
      }));
    }

    // 2. Supprimer les abonnés aux listes de diffusion
    if (mailingListSubscriberCount > 0) {
      console.log('   Suppression des abonnés aux listes...');
      await safeDelete('Abonnés supprimés', () => prisma.mailingListSubscriber.deleteMany({
        where: { donorId: { not: null } }
      }));
    }

    // 3. Supprimer les destinataires d'emails
    if (emailRecipientCount > 0) {
      console.log('   Suppression des destinataires d\'emails...');
      await safeDelete('Destinataires supprimés', () => prisma.emailRecipient.deleteMany({
        where: { donorId: { not: null } }
      }));
    }

    // 4. Supprimer les membres de segments
    if (segmentMembershipCount > 0) {
      console.log('   Suppression des membres de segments...');
      await safeDelete('Membres de segments supprimés', () => prisma.donorSegmentMembership.deleteMany({}));
    }

    // 5. Supprimer les relations campagne-donateur
    if (campaignDonorCount > 0) {
      console.log('   Suppression des relations campagne-donateur...');
      await safeDelete('Relations supprimées', () => prisma.campaignDonor.deleteMany({}));
    }

    // 6. Supprimer les historiques de consentement
    if (consentHistoryCount > 0) {
      console.log('   Suppression des historiques de consentement...');
      await safeDelete('Historiques supprimés', () => prisma.consentHistory.deleteMany({}));
    }

    // 7. Supprimer les communications
    if (communicationCount > 0) {
      console.log('   Suppression des communications...');
      await safeDelete('Communications supprimées', () => prisma.communication.deleteMany({}));
    }

    // 8. Supprimer les soumissions de formulaires
    if (formSubmissionCount > 0) {
      console.log('   Suppression des soumissions de formulaires...');
      await safeDelete('Soumissions supprimées', () => prisma.donationSubmission.deleteMany({}));
    }

    // 9. Supprimer les dons
    if (donationCount > 0) {
      console.log('   Suppression des dons...');
      await safeDelete('Dons supprimés', () => prisma.donation.deleteMany({}));
    }

    // 10. Supprimer les donateurs (cela supprimera automatiquement DonorPreference et DonorCustomField via onDelete: Cascade)
    console.log('   Suppression des donateurs...');
    const deletedDonors = await safeDelete(`${donorCount} donateurs supprimés`, () => prisma.donor.deleteMany({}));
    if (deletedDonors && deletedDonors.count !== undefined) {
      console.log(`   ✅ ${deletedDonors.count} donateurs supprimés`);
    }

    console.log('');
    console.log('✅ Nettoyage terminé avec succès !');
    console.log('');

    // Vérification finale
    const remainingDonors = await prisma.donor.count();
    if (remainingDonors === 0) {
      console.log('✅ Confirmation: Aucun donateur restant dans la base principale');
    } else {
      console.log(`⚠️  Attention: ${remainingDonors} donateurs restants`);
    }

  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le nettoyage
cleanMainDatabase()
  .then(() => {
    console.log('');
    console.log('🎉 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
