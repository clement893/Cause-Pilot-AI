import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/organizations - Liste toutes les organisations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const plan = searchParams.get("plan") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Construire les filtres
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (plan) {
      where.plan = plan;
    }

    // Si pas super admin, filtrer par organisations accessibles
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      const accessibleOrgs = await prisma.adminOrganizationAccess.findMany({
        where: { adminUserId: session.user.id },
        select: { organizationId: true },
      });
      where.id = { in: accessibleOrgs.map((a) => a.organizationId) };
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              members: true,
              dashboardLayouts: true,
            },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des organisations" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/organizations - Créer une nouvelle organisation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent créer des organisations
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Générer le slug
    const slug = body.slug || body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Vérifier que le slug est unique
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: "Ce slug est déjà utilisé" },
        { status: 409 }
      );
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
        status: body.status || "ACTIVE",
        plan: body.plan || "FREE",
        maxUsers: body.maxUsers || 5,
        maxDonors: body.maxDonors || 1000,
        maxCampaigns: body.maxCampaigns || 10,
      },
    });

    // Log d'audit
    await prisma.adminAuditLog.create({
      data: {
        action: "CREATE",
        entityType: "Organization",
        entityId: organization.id,
        description: `Création de l'organisation ${organization.name}`,
        adminUserId: session.user.id,
        metadata: { organizationName: organization.name },
      },
    });

    return NextResponse.json(
      { success: true, data: organization },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de l'organisation" },
      { status: 500 }
    );
  }
}
