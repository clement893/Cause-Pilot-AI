import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";
import { Prisma, OrganizationStatus, OrganizationPlan } from "@prisma/client";

// GET /api/super-admin/organizations - Liste toutes les organisations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    console.log("Session:", JSON.stringify(session, null, 2));
    
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
    const where: Prisma.OrganizationWhereInput = {};
    
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }
    
    if (status && Object.values(OrganizationStatus).includes(status as OrganizationStatus)) {
      where.status = status as OrganizationStatus;
    }
    
    if (plan && Object.values(OrganizationPlan).includes(plan as OrganizationPlan)) {
      where.plan = plan as OrganizationPlan;
    }

    // Pour le super admin, on récupère toutes les organisations
    // Vérification simplifiée - les utilisateurs @nukleo.com sont super admin
    const isSuperAdmin = session.user.email?.endsWith("@nukleo.com");
    
    console.log("isSuperAdmin:", isSuperAdmin);
    console.log("User email:", session.user.email);
    
    // Utiliser la base principale pour les organisations (métadonnées)
    const mainPrisma = getMainPrisma();

    // Debug: Vérifier la connexion et compter toutes les organisations
    try {
      // Log de l'URL de la base de données (masquer le mot de passe)
      const dbUrl = process.env.DATABASE_URL || 'NOT SET';
      const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
      console.log("DATABASE_URL:", maskedUrl);
      
      const allOrgsCount = await mainPrisma.organization.count();
      console.log("Total organizations in database:", allOrgsCount);
      
      // Récupérer toutes les organisations sans filtre pour debug
      const allOrgs = await mainPrisma.organization.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      });
      console.log("Sample organizations:", JSON.stringify(allOrgs, null, 2));
    } catch (dbError) {
      console.error("Database connection error:", dbError);
    }

    if (!isSuperAdmin) {
      // Pour les non-super admin, filtrer par organisations accessibles
      const accessibleOrgs = await mainPrisma.adminOrganizationAccess.findMany({
        where: { adminUserId: session.user.id },
        select: { organizationId: true },
      });
      where.id = { in: accessibleOrgs.map((a: { organizationId: string }) => a.organizationId) };
    }

    console.log("Where clause:", JSON.stringify(where, null, 2));

    const [organizations, total] = await Promise.all([
      mainPrisma.organization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          email: true,
          phone: true,
          status: true,
          plan: true,
          createdAt: true,
          databaseUrl: true, // Inclure l'URL de la base de données dédiée
          _count: {
            select: {
              OrganizationMember: true,
              DashboardLayout: true,
            },
          },
        },
      }),
      mainPrisma.organization.count({ where }),
    ]);

    console.log("Organizations found:", organizations.length);
    console.log("Total:", total);

    // Mapper les données pour correspondre à l'interface TypeScript de la page
    const mappedOrganizations = organizations.map((org: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      plan: string;
      createdAt: Date;
      databaseUrl: string | null;
      _count: {
        OrganizationMember: number;
        DashboardLayout: number;
      };
    }) => ({
      ...org,
      createdAt: org.createdAt.toISOString(),
      _count: {
        members: org._count.OrganizationMember,
        dashboardLayouts: org._count.DashboardLayout,
      },
    }));

    return NextResponse.json({
      success: true,
      data: mappedOrganizations,
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
      { success: false, error: "Erreur lors de la récupération des organisations", details: String(error) },
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

    // Seuls les utilisateurs @nukleo.com peuvent créer des organisations
    if (!session.user.email?.endsWith("@nukleo.com")) {
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

    // Utiliser la base principale pour les organisations (métadonnées)
    const mainPrisma = getMainPrisma();

    // Vérifier que le slug est unique
    const existingOrg = await mainPrisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: "Ce slug est déjà utilisé" },
        { status: 409 }
      );
    }

    const organization = await mainPrisma.organization.create({
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
    await mainPrisma.adminAuditLog.create({
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
