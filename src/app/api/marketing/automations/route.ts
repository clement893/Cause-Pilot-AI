import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des règles d'automatisation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const triggerType = searchParams.get("triggerType");

    const where: Record<string, unknown> = {};

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (triggerType) {
      where.triggerType = triggerType;
    }

    const automations = await prisma.automationRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { EmailCampaign: true },
        },
      },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des automatisations" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle règle d'automatisation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const automation = await prisma.automationRule.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive ?? false,
        triggerType: body.triggerType,
        triggerConfig: body.triggerConfig,
        conditions: body.conditions,
        actionType: body.actionType,
        actionConfig: body.actionConfig,
        delayMinutes: body.delayMinutes || 0,
        delayType: body.delayType || "IMMEDIATE",
        maxExecutions: body.maxExecutions,
        cooldownHours: body.cooldownHours,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'automatisation" },
      { status: 500 }
    );
  }
}
