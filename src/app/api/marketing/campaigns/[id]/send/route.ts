import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkEmails, EmailOptions } from "@/lib/sendgrid";

// POST - Envoyer une campagne email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer la campagne
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        template: true,
        recipients: {
          where: { status: "PENDING" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne non trouvée" },
        { status: 404 }
      );
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Cette campagne ne peut pas être envoyée" },
        { status: 400 }
      );
    }

    // Si aucun destinataire, ajouter les donateurs avec consentement email
    if (campaign.recipients.length === 0) {
      // Construire les conditions de filtrage
      const donorWhere: Record<string, unknown> = {
        consentEmail: true,
        email: { not: null },
        status: { not: "DO_NOT_CONTACT" },
      };

      // Filtrer par segments si spécifiés
      if (campaign.segments && campaign.segments.length > 0) {
        donorWhere.segment = { in: campaign.segments };
      }

      // Filtrer par tags si spécifiés
      if (campaign.tags && campaign.tags.length > 0) {
        donorWhere.tags = { hasSome: campaign.tags };
      }

      const donors = await prisma.donor.findMany({
        where: donorWhere,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      // Créer les destinataires
      if (donors.length > 0) {
        await prisma.emailRecipient.createMany({
          data: donors.map((donor) => ({
            campaignId: id,
            email: donor.email!,
            firstName: donor.firstName,
            lastName: donor.lastName,
            donorId: donor.id,
            status: "PENDING",
          })),
          skipDuplicates: true,
        });
      }
    }

    // Mettre à jour le statut de la campagne
    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: "SENDING",
        sentAt: new Date(),
      },
    });

    // Récupérer le nombre total de destinataires
    const totalRecipients = await prisma.emailRecipient.count({
      where: { campaignId: id },
    });

    // Mettre à jour le compteur
    await prisma.emailCampaign.update({
      where: { id },
      data: { totalRecipients },
    });

    // Récupérer tous les destinataires en attente
    const pendingRecipients = await prisma.emailRecipient.findMany({
      where: { campaignId: id, status: "PENDING" },
    });

    // Préparer les emails à envoyer
    const emailOptions: EmailOptions[] = pendingRecipients.map((recipient) => {
      let htmlContent = campaign.template?.htmlContent || "";
      let textContent = campaign.template?.textContent || "";

      // Remplacer les variables
      htmlContent = htmlContent
        .replace(/{{firstName}}/g, recipient.firstName || "")
        .replace(/{{lastName}}/g, recipient.lastName || "")
        .replace(/{{email}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"));

      textContent = textContent
        .replace(/{{firstName}}/g, recipient.firstName || "")
        .replace(/{{lastName}}/g, recipient.lastName || "")
        .replace(/{{email}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"));

      return {
        to: recipient.email,
        subject: campaign.subject || "Sans sujet",
        html: htmlContent,
        text: textContent,
        from: campaign.fromEmail ? {
          email: campaign.fromEmail,
          name: campaign.fromName || undefined,
        } : undefined,
        categories: ["campaign", campaign.id],
        customArgs: {
          campaignId: campaign.id,
          recipientId: recipient.id,
        },
      };
    });

    // Envoyer les emails via SendGrid
    let sendResult = { success: 0, failed: 0 };
    if (emailOptions.length > 0) {
      sendResult = await sendBulkEmails(emailOptions);
    }

    // Mettre à jour le statut des destinataires
    if (sendResult.success > 0) {
      await prisma.emailRecipient.updateMany({
        where: { campaignId: id, status: "PENDING" },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    // Marquer la campagne comme envoyée
    const sentCount = sendResult.success;
    const deliveredCount = sentCount; // Les stats réelles viendront des webhooks SendGrid
    const openCount = 0; // Sera mis à jour par les webhooks
    const clickCount = 0; // Sera mis à jour par les webhooks

    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: "SENT",
        completedAt: new Date(),
        sentCount,
        deliveredCount,
        openCount,
        clickCount,
        bounceCount: totalRecipients - deliveredCount,
        openRate: totalRecipients > 0 ? (openCount / totalRecipients) * 100 : 0,
        clickRate: totalRecipients > 0 ? (clickCount / totalRecipients) * 100 : 0,
        bounceRate: totalRecipients > 0 ? ((totalRecipients - deliveredCount) / totalRecipients) * 100 : 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Campagne envoyée à ${totalRecipients} destinataires`,
      stats: {
        totalRecipients,
        sentCount,
        deliveredCount,
        openCount,
        clickCount,
      },
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la campagne" },
      { status: 500 }
    );
  }
}
