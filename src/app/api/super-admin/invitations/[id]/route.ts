import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// DELETE /api/super-admin/invitations/[id] - Révoquer une invitation
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

    // Seuls les super admins peuvent révoquer les invitations
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const invitationId = params.id;

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: "ID d'invitation requis" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    const invitation = await mainPrisma.adminInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation introuvable" },
        { status: 404 }
      );
    }

    const updatedInvitation = await mainPrisma.adminInvitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    // Log d'audit
    await mainPrisma.adminAuditLog.create({
      data: {
        action: "UPDATE",
        entityType: "AdminInvitation",
        entityId: updatedInvitation.id,
        description: `Invitation révoquée pour ${updatedInvitation.email}`,
        adminUserId: session.user.id,
        metadata: { 
          email: updatedInvitation.email,
          previousStatus: invitation.status,
          newStatus: "REVOKED",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation révoquée avec succès",
      data: updatedInvitation,
    });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la révocation de l'invitation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

