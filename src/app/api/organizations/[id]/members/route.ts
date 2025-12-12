import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des membres d'une organisation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les informations des utilisateurs
    const userIds = members.map((m) => m.userId);
    const users = await prisma.adminUser.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const membersWithUsers = members.map((member) => ({
      ...member,
      user: users.find((u) => u.id === member.userId),
    }));

    return NextResponse.json(membersWithUsers);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des membres" },
      { status: 500 }
    );
  }
}

// POST - Ajouter un membre à l'organisation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier si le membre existe déjà
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: body.userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "L'utilisateur est déjà membre de cette organisation" },
        { status: 400 }
      );
    }

    // Vérifier les limites du plan
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (organization && organization._count.members >= organization.maxUsers) {
      return NextResponse.json(
        { error: "Limite de membres atteinte pour ce plan" },
        { status: 400 }
      );
    }

    const member = await prisma.organizationMember.create({
      data: {
        organizationId: id,
        userId: body.userId,
        role: body.role || "MEMBER",
        permissions: body.permissions || [],
        status: body.status || "INVITED",
        invitedAt: new Date(),
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du membre" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un membre
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const member = await prisma.organizationMember.update({
      where: { id: body.memberId },
      data: {
        role: body.role,
        permissions: body.permissions,
        status: body.status,
        joinedAt: body.status === "ACTIVE" ? new Date() : undefined,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du membre" },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un membre
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du membre" },
      { status: 500 }
    );
  }
}
