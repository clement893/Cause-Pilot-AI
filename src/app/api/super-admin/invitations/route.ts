import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";

// GET /api/super-admin/invitations - Récupérer les invitations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent voir les invitations
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const mainPrisma = getMainPrisma();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const invitations = await mainPrisma.adminInvitation.findMany({
      where: {
        status: status as "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED",
      },
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
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: invitations,
      count: invitations.length,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des invitations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


