import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// DELETE /api/super-admin/users/[id]/organizations/[orgId] - Retirer une organisation d'un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orgId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent retirer des organisations
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id: userId, orgId: organizationId } = await params;

    if (!userId || !organizationId) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur et organisation requis" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    // Récupérer l'accès avant suppression pour le log
    const access = await mainPrisma.adminOrganizationAccess.findUnique({
      where: {
        adminUserId_organizationId: {
          adminUserId: userId,
          organizationId: organizationId,
        },
      },
      include: {
        AdminUser: {
          select: { email: true },
        },
        Organization: {
          select: { name: true },
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { success: false, error: "Accès introuvable" },
        { status: 404 }
      );
    }

    // Supprimer l'accès
    await mainPrisma.adminOrganizationAccess.delete({
      where: {
        adminUserId_organizationId: {
          adminUserId: userId,
          organizationId: organizationId,
        },
      },
    });

    // Log d'audit
    await mainPrisma.adminAuditLog.create({
      data: {
        action: "DELETE",
        entityType: "AdminOrganizationAccess",
        entityId: access.id,
        description: `Retrait de l'organisation ${access.Organization.name} de l'utilisateur ${access.AdminUser.email}`,
        adminUserId: session.user.id,
        metadata: {
          userId: userId,
          userEmail: access.AdminUser.email,
          organizationId: organizationId,
          organizationName: access.Organization.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organisation retirée avec succès",
    });
  } catch (error) {
    console.error("Error removing organization:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du retrait de l'organisation" },
      { status: 500 }
    );
  }
}
