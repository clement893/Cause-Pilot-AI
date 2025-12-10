import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Exécuter une action en masse sur les donateurs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, donorIds, params } = body;

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return NextResponse.json(
        { error: "Aucun donateur sélectionné" },
        { status: 400 }
      );
    }

    let result: { success: boolean; affected: number; message: string };

    switch (action) {
      case "update_segment":
        // Mettre à jour le segment des donateurs
        await prisma.donor.updateMany({
          where: { id: { in: donorIds } },
          data: { segment: params.segment },
        });
        result = {
          success: true,
          affected: donorIds.length,
          message: `${donorIds.length} donateur(s) déplacé(s) vers le segment "${params.segment}"`,
        };
        break;

      case "update_status":
        // Mettre à jour le statut des donateurs
        await prisma.donor.updateMany({
          where: { id: { in: donorIds } },
          data: { status: params.status },
        });
        result = {
          success: true,
          affected: donorIds.length,
          message: `Statut de ${donorIds.length} donateur(s) mis à jour`,
        };
        break;

      case "add_tag":
        // Ajouter un tag aux donateurs
        const donorsForTag = await prisma.donor.findMany({
          where: { id: { in: donorIds } },
          select: { id: true, tags: true },
        });
        
        await Promise.all(
          donorsForTag.map(async (donor) => {
            const currentTags = donor.tags || [];
            if (!currentTags.includes(params.tag)) {
              currentTags.push(params.tag);
              await prisma.donor.update({
                where: { id: donor.id },
                data: { tags: currentTags },
              });
            }
          })
        );
        result = {
          success: true,
          affected: donorIds.length,
          message: `Tag "${params.tag}" ajouté à ${donorIds.length} donateur(s)`,
        };
        break;

      case "remove_tag":
        // Retirer un tag des donateurs
        const donorsForTagRemoval = await prisma.donor.findMany({
          where: { id: { in: donorIds } },
          select: { id: true, tags: true },
        });
        
        await Promise.all(
          donorsForTagRemoval.map(async (donor) => {
            if (donor.tags && donor.tags.length > 0) {
              const newTags = donor.tags.filter(t => t !== params.tag);
              await prisma.donor.update({
                where: { id: donor.id },
                data: { tags: newTags },
              });
            }
          })
        );
        result = {
          success: true,
          affected: donorIds.length,
          message: `Tag "${params.tag}" retiré de ${donorIds.length} donateur(s)`,
        };
        break;

      case "add_to_mailing_list":
        // Ajouter à une liste de diffusion
        const existingSubscriptions = await prisma.mailingListSubscriber.findMany({
          where: {
            listId: params.listId,
            donorId: { in: donorIds },
          },
          select: { donorId: true },
        });
        const existingDonorIds = existingSubscriptions.map(s => s.donorId);
        const newDonorIds = donorIds.filter((id: string) => !existingDonorIds.includes(id));
        
        if (newDonorIds.length > 0) {
          // Récupérer les emails des donateurs
          const donors = await prisma.donor.findMany({
            where: { id: { in: newDonorIds } },
            select: { id: true, email: true },
          });
          
          await prisma.mailingListSubscriber.createMany({
            data: donors
              .filter(d => d.email)
              .map(d => ({
                listId: params.listId,
                donorId: d.id,
                email: d.email!,
                status: "ACTIVE",
              })),
          });
        }
        result = {
          success: true,
          affected: newDonorIds.length,
          message: `${newDonorIds.length} donateur(s) ajouté(s) à la liste de diffusion`,
        };
        break;

      case "create_email_campaign":
        // Créer une campagne email pour les donateurs sélectionnés
        const donorsForEmail = await prisma.donor.findMany({
          where: { 
            id: { in: donorIds },
            email: { not: null },
          },
          select: { id: true, email: true, firstName: true, lastName: true },
        });

        const emailCampaign = await prisma.emailCampaign.create({
          data: {
            name: params.name || `Campagne - ${new Date().toLocaleDateString("fr-CA")}`,
            subject: params.subject || "Nouvelle communication",
            status: "DRAFT",
            totalRecipients: donorsForEmail.length,
          },
        });

        // Créer les destinataires
        await prisma.emailRecipient.createMany({
          data: donorsForEmail.map(d => ({
            campaignId: emailCampaign.id,
            donorId: d.id,
            email: d.email!,
            status: "PENDING",
          })),
        });

        result = {
          success: true,
          affected: donorsForEmail.length,
          message: `Campagne email créée avec ${donorsForEmail.length} destinataire(s)`,
        };
        break;

      case "export":
        // Exporter les donateurs sélectionnés
        const donorsToExport = await prisma.donor.findMany({
          where: { id: { in: donorIds } },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            totalDonations: true,
            donationCount: true,
            lastDonationDate: true,
            segment: true,
            status: true,
            
          },
        });

        return NextResponse.json({
          success: true,
          affected: donorsToExport.length,
          data: donorsToExport,
          message: `${donorsToExport.length} donateur(s) exporté(s)`,
        });

      case "delete":
        // Supprimer les donateurs (soft delete via status)
        await prisma.donor.updateMany({
          where: { id: { in: donorIds } },
          data: { status: "ARCHIVED" },
        });
        result = {
          success: true,
          affected: donorIds.length,
          message: `${donorIds.length} donateur(s) archivé(s)`,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution de l'action" },
      { status: 500 }
    );
  }
}
