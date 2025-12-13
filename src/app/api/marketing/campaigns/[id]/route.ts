import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        EmailTemplate: true,
        EmailRecipient: {
          take: 100,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { EmailRecipient: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la campagne" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une campagne
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier si la campagne peut être modifiée
    const existingCampaign = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campagne non trouvée" },
        { status: 404 }
      );
    }

    if (["SENT", "SENDING"].includes(existingCampaign.status)) {
      return NextResponse.json(
        { error: "Impossible de modifier une campagne déjà envoyée" },
        { status: 400 }
      );
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        campaignType: body.campaignType,
        status: body.status,
        subject: body.subject,
        preheader: body.preheader,
        htmlContent: body.htmlContent,
        segmentRules: body.segmentRules,
        tags: body.tags,
        segments: body.segments,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        replyTo: body.replyTo,
        isABTest: body.isABTest,
        variantA: body.variantA,
        variantB: body.variantB,
        templateId: body.templateId,
      },
      include: {
        EmailTemplate: true,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la campagne" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une campagne
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si la campagne peut être supprimée
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne non trouvée" },
        { status: 404 }
      );
    }

    if (campaign.status === "SENDING") {
      return NextResponse.json(
        { error: "Impossible de supprimer une campagne en cours d'envoi" },
        { status: 400 }
      );
    }

    // Supprimer les destinataires d'abord
    await prisma.emailRecipient.deleteMany({
      where: { campaignId: id },
    });

    // Supprimer la campagne
    await prisma.emailCampaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la campagne" },
      { status: 500 }
    );
  }
}
