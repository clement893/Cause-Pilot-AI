import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une automatisation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const automation = await prisma.automationRule.findUnique({
      where: { id },
      include: {
        campaigns: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!automation) {
      return NextResponse.json(
        { error: "Automatisation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les logs récents
    const recentLogs = await prisma.automationLog.findMany({
      where: { automationId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ...automation,
      recentLogs,
    });
  } catch (error) {
    console.error("Error fetching automation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'automatisation" },
      { status: 500 }
    );
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

    const automation = await prisma.automationRule.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        triggerType: body.triggerType,
        triggerConfig: body.triggerConfig,
        conditions: body.conditions,
        actionType: body.actionType,
        actionConfig: body.actionConfig,
        delayMinutes: body.delayMinutes,
        delayType: body.delayType,
        maxExecutions: body.maxExecutions,
        cooldownHours: body.cooldownHours,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error updating automation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'automatisation" },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle d'une automatisation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const automation = await prisma.automationRule.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error patching automation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'automatisation" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une automatisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Supprimer les logs associés
    await prisma.automationLog.deleteMany({
      where: { automationId: id },
    });

    // Supprimer l'automatisation
    await prisma.automationRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting automation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'automatisation" },
      { status: 500 }
    );
  }
}
