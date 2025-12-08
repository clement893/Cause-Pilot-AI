import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des fundraisers P2P
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "totalRaised";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Record<string, unknown> = {};

    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;
    if (teamId) where.teamId = teamId;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const [fundraisers, total] = await Promise.all([
      prisma.p2PFundraiser.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          campaign: {
            select: { id: true, name: true, slug: true, goalAmount: true },
          },
          team: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { donations: true },
          },
        },
      }),
      prisma.p2PFundraiser.count({ where }),
    ]);

    return NextResponse.json({
      fundraisers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fundraisers" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau fundraiser
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Générer un slug unique
    const baseSlug = `${body.firstName}-${body.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.p2PFundraiser.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const fundraiser = await prisma.p2PFundraiser.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        photoUrl: body.photoUrl,
        slug,
        title: body.title || `Collecte de ${body.firstName}`,
        story: body.story,
        videoUrl: body.videoUrl,
        goalAmount: body.goalAmount || 500,
        primaryColor: body.primaryColor || "#6366f1",
        coverImageUrl: body.coverImageUrl,
        campaignId: body.campaignId,
        teamId: body.teamId,
        donorId: body.donorId,
        status: "PENDING",
      },
      include: {
        campaign: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Créer l'activité de création de page
    await prisma.p2PActivity.create({
      data: {
        fundraiserId: fundraiser.id,
        activityType: "PAGE_CREATED",
        title: "Page de collecte créée",
        description: `${fundraiser.firstName} a créé sa page de collecte`,
      },
    });

    return NextResponse.json(fundraiser, { status: 201 });
  } catch (error) {
    console.error("Error creating fundraiser:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du fundraiser" },
      { status: 500 }
    );
  }
}
