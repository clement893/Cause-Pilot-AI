import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Détails d'une automatisation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const automation = await prisma.automation.findUnique({
      where: { id },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
        executions: {
          orderBy: { startedAt: "desc" },
          take: 20,
        },
      },
    });

    if (!automation) {
      return NextResponse.json(
        { error: "Automatisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour une automatisation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actions, status } = body;

    // Supprimer les anciennes actions si de nouvelles sont fournies
    if (actions) {
      await prisma.automationStep.deleteMany({
        where: { automationId: id },
      });
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        name,
        description,
        triggerType,
        triggerConfig,
        status,
        ...(actions && {
          actions: {
            create: actions.map((action: { actionType: string; config: Record<string, unknown>; order: number }) => ({
              actionType: action.actionType,
              config: action.config,
              order: action.order,
            })),
          },
        }),
      },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une automatisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.automation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
