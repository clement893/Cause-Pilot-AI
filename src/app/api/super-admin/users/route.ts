import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { getMainPrisma } from "@/lib/prisma-org";
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
      const mainPrisma = getMainPrisma();
      // Debug: vérifier le rôle de l'utilisateur
      const adminUser = await mainPrisma.adminUser.findUnique({
        where: { id: session.user.id },
        select: { role: true, status: true, email: true },
      });
      console.log("Accès refusé - Utilisateur:", adminUser);
      return NextResponse.json(
        { success: false, error: "Accès refusé. Seuls les super admins peuvent accéder à cette page.", userRole: adminUser?.role, userStatus: adminUser?.status },
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

    const mainPrisma = getMainPrisma();

    const [users, total] = await Promise.all([
      mainPrisma.adminUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          AdminOrganizationAccess: {
            include: {
              Organization: {
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
              AdminAuditLog: true,
              AdminOrganizationAccess: true,
            },
          },
        },
      }),
      mainPrisma.adminUser.count({ where }),
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

    const mainPrisma = getMainPrisma();

    // Récupérer l'utilisateur actuel pour comparer les changements
    const currentUser = await mainPrisma.adminUser.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Empêcher la modification de son propre rôle si on n'est pas super admin
    if (body.id === session.user.id && body.role && body.role !== currentUser.role) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Prisma.AdminUserUpdateInput = {};
    const changes: Record<string, any> = {};

    if (body.name !== undefined && body.name !== currentUser.name) {
      updateData.name = body.name;
      changes.name = { from: currentUser.name, to: body.name };
    }

    if (body.email !== undefined && body.email !== currentUser.email) {
      // Vérifier que l'email n'est pas déjà utilisé
      const emailExists = await mainPrisma.adminUser.findUnique({
        where: { email: body.email },
        select: { id: true },
      });

      if (emailExists && emailExists.id !== body.id) {
        return NextResponse.json(
          { success: false, error: "Cet email est déjà utilisé par un autre utilisateur" },
          { status: 400 }
        );
      }

      updateData.email = body.email;
      changes.email = { from: currentUser.email, to: body.email };
    }

    if (body.role !== undefined && body.role !== currentUser.role) {
      if (Object.values(SuperAdminRole).includes(body.role as SuperAdminRole)) {
        updateData.role = body.role as SuperAdminRole;
        changes.role = { from: currentUser.role, to: body.role };
      }
    }

    if (body.status !== undefined && body.status !== currentUser.status) {
      if (Object.values(AdminStatus).includes(body.status as AdminStatus)) {
        updateData.status = body.status as AdminStatus;
        changes.status = { from: currentUser.status, to: body.status };
      }
    }

    // Mettre à jour l'utilisateur
    const user = await mainPrisma.adminUser.update({
      where: { id: body.id },
      data: updateData,
      include: {
        AdminOrganizationAccess: {
          include: {
            Organization: {
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
            AdminAuditLog: true,
            AdminOrganizationAccess: true,
          },
        },
      },
    });

    // Log d'audit seulement si des changements ont été effectués
    if (Object.keys(changes).length > 0) {
      await mainPrisma.adminAuditLog.create({
        data: {
          action: "UPDATE",
          entityType: "AdminUser",
          entityId: user.id,
          description: `Mise à jour de l'utilisateur ${user.email}`,
          adminUserId: session.user.id,
          metadata: { changes },
        },
      });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}
