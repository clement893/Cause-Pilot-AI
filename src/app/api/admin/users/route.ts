import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des utilisateurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.adminUser.count({ where }),
    ]);

    // Récupérer les rôles assignés pour chaque utilisateur
    const userIds = users.map((u) => u.id);
    const roleAssignments = await prisma.adminUserRoleAssignment.findMany({
      where: { userId: { in: userIds } },
      include: { role: true },
    });

    const usersWithRoles = users.map((user) => ({
      ...user,
      assignedRoles: roleAssignments
        .filter((ra) => ra.userId === user.id)
        .map((ra) => ra.role),
    }));

    return NextResponse.json({
      users: usersWithRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST - Créer un utilisateur (invitation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, roleId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "L'email est requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Créer une invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    const invitation = await prisma.invitation.create({
      data: {
        email,
        roleId: roleId || "",
        token,
        expiresAt,
        invitedBy: 1, // TODO: Récupérer l'ID de l'utilisateur connecté
        invitedByName: "Admin",
      },
    });

    // TODO: Envoyer l'email d'invitation

    return NextResponse.json({
      message: "Invitation envoyée avec succès",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation" },
      { status: 500 }
    );
  }
}
