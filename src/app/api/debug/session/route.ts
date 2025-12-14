import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const mainPrisma = getMainPrisma();
    
    // Récupérer l'utilisateur admin
    const adminUser = await mainPrisma.adminUser.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Récupérer les accès aux organisations
    const organizationAccesses = await mainPrisma.adminOrganizationAccess.findMany({
      where: { adminUserId: session.user.id },
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

    // Récupérer toutes les organisations (pour debug)
    const allOrganizations = await mainPrisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
        organizationId: session.user.organizationId,
        organizationName: session.user.organizationName,
        organizationSlug: session.user.organizationSlug,
      },
      adminUser,
      organizationAccesses,
      allOrganizations,
      debug: {
        hasOrganizationInSession: !!session.user.organizationId,
        hasOrganizationAccesses: organizationAccesses.length > 0,
        totalOrganizations: allOrganizations.length,
      },
    });
  } catch (error) {
    console.error("Error in debug session endpoint:", error);
    return NextResponse.json(
      { error: "Erreur lors du debug", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
