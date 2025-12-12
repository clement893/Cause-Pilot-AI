import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Détail d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // AdminUser utilise un id de type string (cuid)
    const userId = id;

    const user = await prisma.adminUser.findUnique({
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

    return NextResponse.json(user);
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
    const userId = id;
    const body = await request.json();
    const { name, role, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    const user = await prisma.adminUser.update({
      where: { id: userId },
      data: updateData,
    });

    // Log d'audit
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: userId,
        action: "UPDATE",
        entityType: "AdminUser",
        entityId: id,
        description: `Mise à jour de l'utilisateur ${user.email}`,
        metadata: body,
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
    const userId = id;

    // Vérifier que l'utilisateur existe
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Désactiver l'utilisateur au lieu de le supprimer
    await prisma.adminUser.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });

    // Log d'audit
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: userId,
        action: "DELETE",
        entityType: "AdminUser",
        entityId: id,
        description: `Désactivation de l'utilisateur ${user.email}`,
      },
    });

    return NextResponse.json({ message: "Utilisateur désactivé avec succès" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
