import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/audit - Liste des logs d'audit
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent voir les logs d'audit
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const adminUserId = searchParams.get("adminUserId") || "";

    // Construire les filtres
    const where: any = {};
    
    if (action) {
      where.action = action;
    }
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (adminUserId) {
      where.adminUserId = adminUserId;
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          adminUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des logs" },
      { status: 500 }
    );
  }
}
