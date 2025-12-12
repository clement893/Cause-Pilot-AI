import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Layout par défaut pour les nouveaux utilisateurs
const DEFAULT_LAYOUT = {
  widgets: [
    { id: "stat-1", type: "STAT_TOTAL_DONATIONS", x: 0, y: 0, w: 3, h: 2 },
    { id: "stat-2", type: "STAT_DONOR_COUNT", x: 3, y: 0, w: 3, h: 2 },
    { id: "stat-3", type: "STAT_AVERAGE_DONATION", x: 6, y: 0, w: 3, h: 2 },
    { id: "stat-4", type: "STAT_MONTHLY_REVENUE", x: 9, y: 0, w: 3, h: 2 },
    { id: "chart-1", type: "CHART_DONATIONS_OVER_TIME", x: 0, y: 2, w: 8, h: 4 },
    { id: "chart-2", type: "CHART_DONATIONS_BY_TYPE", x: 8, y: 2, w: 4, h: 4 },
    { id: "list-1", type: "LIST_TOP_DONORS", x: 0, y: 6, w: 6, h: 4 },
    { id: "list-2", type: "LIST_RECENT_DONATIONS", x: 6, y: 6, w: 6, h: 4 },
  ],
};

// GET - Récupérer les layouts de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const organizationId = searchParams.get("organizationId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId: parseInt(userId) };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const layouts = await prisma.dashboardLayout.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // Si aucun layout, retourner le layout par défaut
    if (layouts.length === 0) {
      return NextResponse.json([
        {
          id: "default",
          name: "Dashboard par défaut",
          isDefault: true,
          layout: DEFAULT_LAYOUT,
          columns: 12,
          rowHeight: 100,
        },
      ]);
    }

    return NextResponse.json(layouts);
  } catch (error) {
    console.error("Error fetching layouts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des layouts" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau layout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Si c'est le premier layout, le mettre par défaut
    const existingLayouts = await prisma.dashboardLayout.count({
      where: { userId: body.userId },
    });

    const layout = await prisma.dashboardLayout.create({
      data: {
        name: body.name || "Mon Dashboard",
        description: body.description,
        isDefault: existingLayouts === 0 || body.isDefault,
        isShared: body.isShared || false,
        layout: body.layout || DEFAULT_LAYOUT,
        columns: body.columns || 12,
        rowHeight: body.rowHeight || 100,
        userId: body.userId,
        organizationId: body.organizationId,
      },
    });

    // Si ce layout est par défaut, désactiver les autres
    if (layout.isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: {
          userId: body.userId,
          id: { not: layout.id },
        },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(layout, { status: 201 });
  } catch (error) {
    console.error("Error creating layout:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du layout" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un layout
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const layout = await prisma.dashboardLayout.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        isDefault: body.isDefault,
        isShared: body.isShared,
        layout: body.layout,
        columns: body.columns,
        rowHeight: body.rowHeight,
      },
    });

    // Si ce layout est par défaut, désactiver les autres
    if (body.isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: {
          userId: layout.userId,
          id: { not: layout.id },
        },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(layout);
  } catch (error) {
    console.error("Error updating layout:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du layout" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un layout
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du layout requis" },
        { status: 400 }
      );
    }

    await prisma.dashboardLayout.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting layout:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du layout" },
      { status: 500 }
    );
  }
}
