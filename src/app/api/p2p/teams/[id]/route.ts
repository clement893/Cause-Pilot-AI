import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une équipe par ID ou slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const team = await prisma.p2PTeam.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        P2PFundraiser: {
          orderBy: { totalRaised: "desc" },
          include: {
            _count: {
              select: { P2PDonation: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    // Calculer le pourcentage de l'objectif
    const progressPercent = team.goalAmount > 0
      ? Math.min((team.totalRaised / team.goalAmount) * 100, 100)
      : 0;

    return NextResponse.json({
      ...team,
      progressPercent,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'équipe" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une équipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const team = await prisma.p2PTeam.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        logoUrl: body.logoUrl,
        coverImageUrl: body.coverImageUrl,
        goalAmount: body.goalAmount,
        captainId: body.captainId,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'équipe" },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const team = await prisma.p2PTeam.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error patching team:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'équipe" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une équipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Retirer les membres de l'équipe
    await prisma.p2PFundraiser.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    });

    // Supprimer l'équipe
    await prisma.p2PTeam.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'équipe" },
      { status: 500 }
    );
  }
}
