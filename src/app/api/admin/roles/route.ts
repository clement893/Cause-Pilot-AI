import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des rôles
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    const rolesWithPermissions = roles.map((role) => ({
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
      userCount: role._count.userRoles,
    }));

    return NextResponse.json(rolesWithPermissions);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}

// POST - Créer un rôle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du rôle est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le rôle existe déjà
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Un rôle avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        color: color || "#6366f1",
        isSystem: false,
      },
    });

    // Assigner les permissions si fournies
    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1,
        action: "CREATE",
        module: "admin",
        entityType: "Role",
        entityId: role.id,
        description: `Création du rôle ${role.name}`,
        newValue: JSON.stringify(body),
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rôle" },
      { status: 500 }
    );
  }
}
