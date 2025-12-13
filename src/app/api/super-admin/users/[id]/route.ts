import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// DELETE /api/super-admin/users/[id] - Supprimer un utilisateur admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent supprimer des utilisateurs
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé. Seuls les super admins peuvent supprimer des utilisateurs." },
        { status: 403 }
      );
    }

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Empêcher la suppression de soi-même
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    // Vérifier que l'utilisateur existe
    const userToDelete = await mainPrisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        AdminOrganizationAccess: {
          select: {
            organizationId: true,
            Organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Empêcher la suppression d'un autre super admin (sécurité supplémentaire)
    if (userToDelete.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer un super admin" },
        { status: 403 }
      );
    }

    // Supprimer l'utilisateur (les relations seront supprimées en cascade grâce à onDelete: Cascade)
    await mainPrisma.adminUser.delete({
      where: { id: userId },
    });

    // Log d'audit
    await mainPrisma.adminAuditLog.create({
      data: {
        action: "DELETE",
        entityType: "AdminUser",
        entityId: userId,
        description: `Suppression de l'utilisateur ${userToDelete.email}`,
        adminUserId: session.user.id,
        metadata: {
          deletedUserEmail: userToDelete.email,
          deletedUserRole: userToDelete.role,
          organizations: userToDelete.AdminOrganizationAccess.map(access => ({
            id: access.organizationId,
            name: access.Organization.name,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${userToDelete.email} supprimé avec succès`,
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    
    // Gérer les erreurs de contrainte de clé étrangère
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer cet utilisateur car il est lié à d'autres données",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de l'utilisateur",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

