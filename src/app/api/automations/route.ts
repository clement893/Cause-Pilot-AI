import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des automatisations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const triggerType = searchParams.get("triggerType");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (triggerType) where.triggerType = triggerType;

    const automations = await prisma.automation.findMany({
      where,
      include: {
        AutomationStep: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { AutomationExecution: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Erreur lors de la récupération des automatisations:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une automatisation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      triggerType,
      triggerConfig,
      actions,
      status = "DRAFT",
    } = body;

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: "Nom et type de déclencheur requis" },
        { status: 400 }
      );
    }

    // Créer l'automatisation avec ses actions
    const automation = await prisma.automation.create({
      data: {
        name,
        description,
        triggerType,
        triggerConfig,
        status,
        AutomationStep: {
          create: actions?.map((action: { actionType: string; config: Record<string, unknown>; order: number }) => ({
            actionType: action.actionType,
            config: action.config,
            order: action.order,
          })) || [],
        },
      },
      include: {
        AutomationStep: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'automatisation:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
