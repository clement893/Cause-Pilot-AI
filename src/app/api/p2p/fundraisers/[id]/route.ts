import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer un fundraiser par ID ou slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Chercher par ID ou par slug
    const fundraiser = await prisma.p2PFundraiser.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        Campaign: {
          select: {
            id: true,
            name: true,
            slug: true,
            goalAmount: true,
            totalRaised: true,
            startDate: true,
            endDate: true,
            primaryColor: true,
            bannerUrl: true,
          },
        },
        P2PTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            totalRaised: true,
            memberCount: true,
          },
        },
        P2PDonation: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            amount: true,
            donorName: true,
            isAnonymous: true,
            message: true,
            createdAt: true,
          },
        },
        P2PActivity: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!fundraiser) {
      return NextResponse.json(
        { error: "Fundraiser non trouvé" },
        { status: 404 }
      );
    }

    // Incrémenter le compteur de vues
    await prisma.p2PFundraiser.update({
      where: { id: fundraiser.id },
      data: { viewCount: { increment: 1 } },
    });

    // Calculer le pourcentage de l'objectif
    const progressPercent = fundraiser.goalAmount > 0
      ? Math.min((fundraiser.totalRaised / fundraiser.goalAmount) * 100, 100)
      : 0;

    return NextResponse.json({
      ...fundraiser,
      progressPercent,
    });
  } catch (error) {
    console.error("Error fetching fundraiser:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du fundraiser" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un fundraiser
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const fundraiser = await prisma.p2PFundraiser.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        photoUrl: body.photoUrl,
        title: body.title,
        story: body.story,
        videoUrl: body.videoUrl,
        goalAmount: body.goalAmount,
        primaryColor: body.primaryColor,
        coverImageUrl: body.coverImageUrl,
        teamId: body.teamId,
      },
      include: {
        Campaign: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(fundraiser);
  } catch (error) {
    console.error("Error updating fundraiser:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du fundraiser" },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle (statut, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "APPROVED") {
        updateData.approvedAt = new Date();
      }
      if (body.status === "ACTIVE") {
        updateData.publishedAt = new Date();
      }
    }

    if (body.teamId !== undefined) updateData.teamId = body.teamId;

    const fundraiser = await prisma.p2PFundraiser.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(fundraiser);
  } catch (error) {
    console.error("Error patching fundraiser:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du fundraiser" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un fundraiser
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Supprimer les activités associées
    await prisma.p2PActivity.deleteMany({
      where: { fundraiserId: id },
    });

    // Supprimer les donations associées
    await prisma.p2PDonation.deleteMany({
      where: { fundraiserId: id },
    });

    // Supprimer le fundraiser
    await prisma.p2PFundraiser.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fundraiser:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fundraiser" },
      { status: 500 }
    );
  }
}
