import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Détail d'un rôle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          take: 10,
        },
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
      userCount: role._count.userRoles,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du rôle" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un rôle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, color, isActive, permissionIds } = body;

    // Vérifier si le rôle existe
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Ne pas modifier les rôles système
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: "Les rôles système ne peuvent pas être modifiés" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
    });

    // Mettre à jour les permissions si fournies
    if (permissionIds !== undefined) {
      // Supprimer les anciennes permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Ajouter les nouvelles permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1,
        action: "UPDATE",
        module: "admin",
        entityType: "Role",
        entityId: id,
        description: `Mise à jour du rôle ${role.name}`,
        oldValue: JSON.stringify(existingRole),
        newValue: JSON.stringify(body),
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rôle" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rôle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userRoles: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Ne pas supprimer les rôles système
    if (role.isSystem) {
      return NextResponse.json(
        { error: "Les rôles système ne peuvent pas être supprimés" },
        { status: 403 }
      );
    }

    // Ne pas supprimer si des utilisateurs ont ce rôle
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { error: "Ce rôle est assigné à des utilisateurs et ne peut pas être supprimé" },
        { status: 400 }
      );
    }

    // Supprimer les permissions du rôle
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Supprimer le rôle
    await prisma.role.delete({
      where: { id },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1,
        action: "DELETE",
        module: "admin",
        entityType: "Role",
        entityId: id,
        description: `Suppression du rôle ${role.name}`,
      },
    });

    return NextResponse.json({ message: "Rôle supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du rôle" },
      { status: 500 }
    );
  }
}
