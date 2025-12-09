import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Détail d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les rôles assignés
    const roleAssignments = await prisma.userRoleAssignment.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    // Récupérer l'historique d'audit
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ...user,
      assignedRoles: roleAssignments.map((ra) => ra.role),
      recentActivity: auditLogs,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { name, role, assignedRoleIds } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Mettre à jour les rôles assignés si fournis
    if (assignedRoleIds !== undefined) {
      // Supprimer les anciens rôles
      await prisma.userRoleAssignment.deleteMany({
        where: { userId },
      });

      // Ajouter les nouveaux rôles
      if (assignedRoleIds.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: assignedRoleIds.map((roleId: string) => ({
            userId,
            roleId,
            assignedBy: 1, // TODO: Récupérer l'ID de l'utilisateur connecté
          })),
        });
      }
    }

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1, // TODO: Récupérer l'ID de l'utilisateur connecté
        action: "UPDATE",
        module: "admin",
        entityType: "User",
        entityId: id,
        description: `Mise à jour de l'utilisateur ${user.email}`,
        newValue: JSON.stringify(body),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE - Désactiver un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer les rôles assignés
    await prisma.userRoleAssignment.deleteMany({
      where: { userId },
    });

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: 1,
        action: "DELETE",
        module: "admin",
        entityType: "User",
        entityId: id,
        description: `Suppression de l'utilisateur ${user.email}`,
      },
    });

    // Note: On ne supprime pas vraiment l'utilisateur pour garder l'historique
    // Dans une vraie application, on marquerait l'utilisateur comme désactivé

    return NextResponse.json({ message: "Utilisateur désactivé avec succès" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
