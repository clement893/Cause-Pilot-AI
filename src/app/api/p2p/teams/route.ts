import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des équipes P2P
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "totalRaised";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Record<string, unknown> = {};

    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [teams, total] = await Promise.all([
      prisma.p2PTeam.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          members: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              totalRaised: true,
            },
            take: 5,
          },
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.p2PTeam.count({ where }),
    ]);

    return NextResponse.json({
      teams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des équipes" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle équipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Générer un slug unique
    const baseSlug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.p2PTeam.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const team = await prisma.p2PTeam.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        logoUrl: body.logoUrl,
        coverImageUrl: body.coverImageUrl,
        goalAmount: body.goalAmount || 2000,
        campaignId: body.campaignId,
        captainId: body.captainId,
        status: "PENDING",
      },
    });

    // Si un capitaine est spécifié, l'ajouter à l'équipe
    if (body.captainId) {
      await prisma.p2PFundraiser.update({
        where: { id: body.captainId },
        data: { teamId: team.id },
      });

      // Mettre à jour le compteur de membres
      await prisma.p2PTeam.update({
        where: { id: team.id },
        data: { memberCount: 1 },
      });
    }

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'équipe" },
      { status: 500 }
    );
  }
}
