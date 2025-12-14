import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, isSuperAdmin } from "@/lib/auth";

// GET - Liste des organisations
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // Vérifier si l'utilisateur est super admin
    const isSuper = await isSuperAdmin(session.user.id);
    
    if (!isSuper) {
      // Si l'utilisateur n'est pas super admin, filtrer par ses accès
      const userAccesses = await prisma.adminOrganizationAccess.findMany({
        where: { adminUserId: session.user.id },
        select: { organizationId: true },
      });

      const organizationIds = userAccesses.map(access => access.organizationId);
      
      if (organizationIds.length === 0) {
        // L'utilisateur n'a accès à aucune organisation
        return NextResponse.json([]);
      }

      // Filtrer pour ne retourner que les organisations auxquelles l'utilisateur a accès
      where.id = { in: organizationIds };
    }

    const organizations = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { OrganizationMember: true },
        },
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des organisations" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle organisation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Générer un slug unique si non fourni
    let slug = body.slug || body.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Vérifier l'unicité du slug
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      slug = `${slug}-${Date.now()}`;
    }

    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor || "#6366f1",
        secondaryColor: body.secondaryColor || "#8b5cf6",
        legalName: body.legalName,
        charityNumber: body.charityNumber,
        taxId: body.taxId,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || "CA",
        phone: body.phone,
        email: body.email,
        website: body.website,
        timezone: body.timezone || "America/Toronto",
        currency: body.currency || "CAD",
        language: body.language || "fr",
        plan: body.plan || "FREE",
        maxUsers: body.maxUsers || 5,
        maxDonors: body.maxDonors || 1000,
        maxCampaigns: body.maxCampaigns || 10,
      },
    });

    // Ajouter le créateur comme propriétaire si userId fourni
    if (body.userId) {
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: body.userId,
          role: "OWNER",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });
    }

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'organisation" },
      { status: 500 }
    );
  }
}
