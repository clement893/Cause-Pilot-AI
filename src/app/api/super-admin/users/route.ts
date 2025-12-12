import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, SuperAdminRole, AdminStatus } from "@prisma/client";

// GET /api/super-admin/users - Liste tous les utilisateurs admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent voir tous les utilisateurs
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    // Construire les filtres
    const where: Prisma.AdminUserWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (role && Object.values(SuperAdminRole).includes(role as SuperAdminRole)) {
      where.role = role as SuperAdminRole;
    }
    
    if (status && Object.values(AdminStatus).includes(status as AdminStatus)) {
      where.status = status as AdminStatus;
    }

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          managedOrganizations: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              auditLogs: true,
              managedOrganizations: true,
            },
          },
        },
      }),
      prisma.adminUser.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/users - Mettre à jour un utilisateur admin
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent modifier les utilisateurs
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    const user = await prisma.adminUser.update({
      where: { id: body.id },
      data: {
        role: body.role,
        status: body.status,
      },
    });

    // Log d'audit
    await prisma.adminAuditLog.create({
      data: {
        action: "UPDATE",
        entityType: "AdminUser",
        entityId: user.id,
        description: `Mise à jour de l'utilisateur ${user.email}`,
        adminUserId: session.user.id,
        metadata: { changes: { role: body.role, status: body.status } },
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}
