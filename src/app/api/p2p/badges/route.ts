import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des badges disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fundraiserId = searchParams.get("fundraiserId");

    const badges = await prisma.p2PBadge.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Si un fundraiserId est fourni, marquer les badges obtenus
    if (fundraiserId) {
      const fundraiser = await prisma.p2PFundraiser.findUnique({
        where: { id: fundraiserId },
        select: { badges: true },
      });

      const earnedBadgeIds = fundraiser?.badges || [];

      const badgesWithStatus = badges.map((badge) => ({
        ...badge,
        earned: earnedBadgeIds.includes(badge.id),
      }));

      return NextResponse.json(badgesWithStatus);
    }

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des badges" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau badge (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const badge = await prisma.p2PBadge.create({
      data: {
        name: body.name,
        description: body.description,
        iconUrl: body.iconUrl,
        color: body.color || "#6366f1",
        badgeType: body.badgeType,
        threshold: body.threshold,
        pointsAwarded: body.pointsAwarded || 10,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error("Error creating badge:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du badge" },
      { status: 500 }
    );
  }
}
