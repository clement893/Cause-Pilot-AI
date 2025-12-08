import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des campagnes avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.campaignType = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Récupérer les campagnes
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          milestones: {
            orderBy: { sortOrder: "asc" },
            take: 5,
          },
          _count: {
            select: {
              donors: true,
              forms: true,
              updates: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle campagne
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
    
    while (await prisma.campaign.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        shortDescription: body.shortDescription,
        campaignType: body.campaignType || "FUNDRAISING",
        status: body.status || "DRAFT",
        priority: body.priority || "MEDIUM",
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        launchDate: body.launchDate ? new Date(body.launchDate) : null,
        goalAmount: body.goalAmount ? parseFloat(body.goalAmount) : null,
        minimumGoal: body.minimumGoal ? parseFloat(body.minimumGoal) : null,
        stretchGoal: body.stretchGoal ? parseFloat(body.stretchGoal) : null,
        primaryColor: body.primaryColor || "#6366f1",
        secondaryColor: body.secondaryColor || "#8b5cf6",
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        thumbnailUrl: body.thumbnailUrl,
        thankYouMessage: body.thankYouMessage,
        impactStatement: body.impactStatement,
        isPublic: body.isPublic ?? true,
        allowP2P: body.allowP2P ?? false,
        enableMatching: body.enableMatching ?? false,
        matchingRatio: body.matchingRatio ? parseFloat(body.matchingRatio) : null,
        matchingCap: body.matchingCap ? parseFloat(body.matchingCap) : null,
        category: body.category,
        tags: body.tags || [],
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        ogImage: body.ogImage,
      },
      include: {
        milestones: true,
        _count: {
          select: {
            donors: true,
            forms: true,
          },
        },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
