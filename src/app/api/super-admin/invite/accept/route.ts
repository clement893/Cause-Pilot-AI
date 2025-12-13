import { NextRequest, NextResponse } from "next/server";
import { getMainPrisma } from "@/lib/prisma-org";

// GET /api/super-admin/invite/accept?token=xxx - Vérifier le token d'invitation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token manquant" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    const invitation = await mainPrisma.adminInvitation.findUnique({
      where: { token },
      include: {
        Organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        AdminUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si l'invitation a expiré
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Cette invitation a expiré" },
        { status: 410 }
      );
    }

    // Vérifier si l'invitation a déjà été acceptée
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { success: false, error: "Cette invitation a déjà été acceptée" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        organization: invitation.Organization,
        invitedBy: invitation.AdminUser,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la vérification de l'invitation" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/invite/accept - Accepter l'invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token manquant" },
        { status: 400 }
      );
    }

    const mainPrisma = getMainPrisma();

    const invitation = await mainPrisma.adminInvitation.findUnique({
      where: { token },
      include: {
        Organization: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier si l'invitation a expiré
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Cette invitation a expiré" },
        { status: 410 }
      );
    }

    // Vérifier si l'invitation a déjà été acceptée
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { success: false, error: "Cette invitation a déjà été acceptée" },
        { status: 409 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await mainPrisma.adminUser.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      // Si l'utilisateur existe déjà, mettre à jour l'invitation et créer l'accès si nécessaire
      if (invitation.organizationId) {
        // Créer l'accès à l'organisation s'il n'existe pas déjà
        await mainPrisma.adminOrganizationAccess.upsert({
          where: {
            adminUserId_organizationId: {
              adminUserId: existingUser.id,
              organizationId: invitation.organizationId,
            },
          },
          create: {
            adminUserId: existingUser.id,
            organizationId: invitation.organizationId,
            canEdit: true,
            canDelete: false,
            canManageUsers: false,
          },
          update: {},
        });
      } else {
        // Mettre à jour le rôle si c'est une invitation admin
        if (invitation.role) {
          await mainPrisma.adminUser.update({
            where: { id: existingUser.id },
            data: { role: invitation.role },
          });
        }
      }

      // Marquer l'invitation comme acceptée
      await mainPrisma.adminInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          message: "Invitation acceptée",
          userId: existingUser.id,
        },
      });
    }

    // Créer l'utilisateur admin
    const adminUser = await mainPrisma.adminUser.create({
      data: {
        email: invitation.email,
        role: invitation.role || "ADMIN",
        status: "ACTIVE", // Actif après acceptation
      },
    });

    // Si c'est une invitation pour une organisation, créer l'accès
    if (invitation.organizationId) {
      await mainPrisma.adminOrganizationAccess.create({
        data: {
          adminUserId: adminUser.id,
          organizationId: invitation.organizationId,
          canEdit: true,
          canDelete: false,
          canManageUsers: false,
        },
      });
    }

    // Marquer l'invitation comme acceptée
    await mainPrisma.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // Log d'audit
    await mainPrisma.adminAuditLog.create({
      data: {
        action: "ACCEPT",
        entityType: "AdminInvitation",
        entityId: invitation.id,
        description: `Acceptation de l'invitation pour ${invitation.email}`,
        adminUserId: adminUser.id,
        metadata: {
          email: invitation.email,
          role: invitation.role,
          organizationId: invitation.organizationId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Invitation acceptée avec succès",
        userId: adminUser.id,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'acceptation de l'invitation", details: String(error) },
      { status: 500 }
    );
  }
}

