import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Récupérer un formulaire par ID ou slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Chercher par ID ou par slug
    const form = await prisma.donationForm.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
        ],
      },
      include: {
        FormField: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { DonationSubmission: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Formulaire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du formulaire" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un formulaire
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier que le formulaire existe
    const existingForm = await prisma.donationForm.findUnique({
      where: { id },
    });

    if (!existingForm) {
      return NextResponse.json(
        { error: "Formulaire non trouvé" },
        { status: 404 }
      );
    }

    // Si le slug change, vérifier qu'il n'existe pas déjà
    if (body.slug && body.slug !== existingForm.slug) {
      const slugExists = await prisma.donationForm.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    const form = await prisma.donationForm.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        formType: body.formType,
        status: body.status,
        suggestedAmounts: body.suggestedAmounts,
        minimumAmount: body.minimumAmount,
        maximumAmount: body.maximumAmount,
        allowCustomAmount: body.allowCustomAmount,
        defaultAmount: body.defaultAmount,
        recurringOptions: body.recurringOptions,
        defaultRecurring: body.defaultRecurring,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        thankYouMessage: body.thankYouMessage,
        thankYouRedirectUrl: body.thankYouRedirectUrl,
        collectPhone: body.collectPhone,
        collectAddress: body.collectAddress,
        collectEmployer: body.collectEmployer,
        collectComment: body.collectComment,
        collectDedication: body.collectDedication,
        allowAnonymous: body.allowAnonymous,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        campaignId: body.campaignId,
        campaignName: body.campaignName,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        goalAmount: body.goalAmount,
      },
      include: {
        FormField: true,
      },
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du formulaire" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un formulaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier que le formulaire existe
    const existingForm = await prisma.donationForm.findUnique({
      where: { id },
      include: {
        _count: {
          select: { DonationSubmission: true },
        },
      },
    });

    if (!existingForm) {
      return NextResponse.json(
        { error: "Formulaire non trouvé" },
        { status: 404 }
      );
    }

    // Avertir si des soumissions existent
    if (existingForm._count.DonationSubmission > 0) {
      // Archiver plutôt que supprimer
      await prisma.donationForm.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });
      
      return NextResponse.json({
        message: "Formulaire archivé (contient des soumissions)",
        archived: true,
      });
    }

    // Supprimer le formulaire et ses champs
    await prisma.donationForm.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Formulaire supprimé avec succès",
      deleted: true,
    });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du formulaire" },
      { status: 500 }
    );
  }
}
