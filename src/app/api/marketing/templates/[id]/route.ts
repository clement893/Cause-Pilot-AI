import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer un template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        campaigns: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            status: true,
            sentAt: true,
          },
        },
        _count: {
          select: { campaigns: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du template" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        subject: body.subject,
        preheader: body.preheader,
        htmlContent: body.htmlContent,
        textContent: body.textContent,
        variables: body.variables,
        primaryColor: body.primaryColor,
        logoUrl: body.logoUrl,
        footerText: body.footerText,
        isActive: body.isActive,
        isDefault: body.isDefault,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du template" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si le template est utilisé
    const campaignCount = await prisma.emailCampaign.count({
      where: { templateId: id },
    });

    if (campaignCount > 0) {
      return NextResponse.json(
        { error: `Ce template est utilisé par ${campaignCount} campagne(s)` },
        { status: 400 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du template" },
      { status: 500 }
    );
  }
}
