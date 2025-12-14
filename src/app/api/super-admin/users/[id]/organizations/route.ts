import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// GET /api/super-admin/users/[id]/organizations - Récupérer les organisations d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent voir les attributions
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    const accesses = await mainPrisma.adminOrganizationAccess.findMany({
      where: { adminUserId: userId },
      include: {
        Organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: accesses.map(access => ({
        id: access.id,
        organizationId: access.organizationId,
        organization: access.Organization,
        canEdit: access.canEdit,
        canDelete: access.canDelete,
        canManageUsers: access.canManageUsers,
        createdAt: access.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des organisations" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/users/[id]/organizations - Attribuer une organisation à un utilisateur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent attribuer des organisations
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    if (!body.organizationId) {
      return NextResponse.json(
        { success: false, error: "ID organisation requis" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    // Vérifier que l'utilisateur existe
    const user = await mainPrisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'organisation existe
    const organization = await mainPrisma.organization.findUnique({
      where: { id: body.organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si l'accès existe déjà
    const existingAccess = await mainPrisma.adminOrganizationAccess.findUnique({
      where: {
        adminUserId_organizationId: {
          adminUserId: userId,
          organizationId: body.organizationId,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { success: false, error: "L'utilisateur a déjà accès à cette organisation" },
        { status: 400 }
      );
    }

    // Créer l'accès
    const access = await mainPrisma.adminOrganizationAccess.create({
      data: {
        adminUserId: userId,
        organizationId: body.organizationId,
        canEdit: body.canEdit ?? true,
        canDelete: body.canDelete ?? false,
        canManageUsers: body.canManageUsers ?? false,
      },
      include: {
        Organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Log d'audit
    await mainPrisma.adminAuditLog.create({
      data: {
        action: "CREATE",
        entityType: "AdminOrganizationAccess",
        entityId: access.id,
        description: `Attribution de l'organisation ${organization.name} à l'utilisateur ${user.email}`,
        adminUserId: session.user.id,
        metadata: {
          userId: userId,
          userEmail: user.email,
          organizationId: body.organizationId,
          organizationName: organization.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: access.id,
        organizationId: access.organizationId,
        organization: access.Organization,
        canEdit: access.canEdit,
        canDelete: access.canDelete,
        canManageUsers: access.canManageUsers,
        createdAt: access.createdAt,
      },
    });
  } catch (error) {
    console.error("Error assigning organization:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'attribution de l'organisation" },
      { status: 500 }
    );
  }
}

