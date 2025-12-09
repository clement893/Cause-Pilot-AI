import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer tous les segments
export async function GET() {
  try {
    const segments = await prisma.donorSegment.findMany({
      where: { isActive: true },
      orderBy: [
        { isSystem: "desc" },
        { donorCount: "desc" },
      ],
    });

    // Calculer les stats pour chaque segment
    const segmentsWithStats = await Promise.all(
      segments.map(async (segment) => {
        if (segment.type === "DYNAMIC" && segment.rules) {
          const count = await countDonorsInSegment(segment.rules);
          return { ...segment, donorCount: count };
        }
        return segment;
      })
    );

    return NextResponse.json(segmentsWithStats);
  } catch (error) {
    console.error("Segments API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des segments" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const segment = await prisma.donorSegment.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color || "#8B5CF6",
        icon: body.icon,
        type: body.type || "DYNAMIC",
        rules: body.rules ? JSON.stringify(body.rules) : null,
        isActive: true,
        isSystem: false,
      },
    });

    // Calculer le nombre de donateurs
    if (segment.type === "DYNAMIC" && segment.rules) {
      const count = await countDonorsInSegment(segment.rules);
      await prisma.donorSegment.update({
        where: { id: segment.id },
        data: { donorCount: count, lastCalculatedAt: new Date() },
      });
    }

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error("Create segment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du segment" },
      { status: 500 }
    );
  }
}

// Fonction pour compter les donateurs dans un segment dynamique
async function countDonorsInSegment(rulesJson: string): Promise<number> {
  try {
    const rules = JSON.parse(rulesJson);
    const where = buildWhereClause(rules);
    return await prisma.donor.count({ where });
  } catch {
    return 0;
  }
}

// Construire la clause WHERE à partir des règles
function buildWhereClause(rules: {
  operator: "AND" | "OR";
  rules: Array<{
    field: string;
    operator: string;
    value: string | number | boolean;
  }>;
}): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  for (const rule of rules.rules) {
    const condition = buildCondition(rule);
    if (condition) {
      conditions.push(condition);
    }
  }

  if (conditions.length === 0) return {};

  if (rules.operator === "OR") {
    return { OR: conditions };
  }
  return { AND: conditions };
}

function buildCondition(rule: {
  field: string;
  operator: string;
  value: string | number | boolean;
}): Record<string, unknown> | null {
  const { field, operator, value } = rule;

  switch (operator) {
    case "equals":
      return { [field]: value };
    case "not_equals":
      return { [field]: { not: value } };
    case "contains":
      return { [field]: { contains: String(value) } };
    case "starts_with":
      return { [field]: { startsWith: String(value) } };
    case "ends_with":
      return { [field]: { endsWith: String(value) } };
    case "greater_than":
      return { [field]: { gt: Number(value) } };
    case "greater_than_or_equal":
      return { [field]: { gte: Number(value) } };
    case "less_than":
      return { [field]: { lt: Number(value) } };
    case "less_than_or_equal":
      return { [field]: { lte: Number(value) } };
    case "is_null":
      return { [field]: null };
    case "is_not_null":
      return { [field]: { not: null } };
    case "in_last_days": {
      const date = new Date();
      date.setDate(date.getDate() - Number(value));
      return { [field]: { gte: date } };
    }
    case "not_in_last_days": {
      const date = new Date();
      date.setDate(date.getDate() - Number(value));
      return { [field]: { lt: date } };
    }
    case "is_true":
      return { [field]: true };
    case "is_false":
      return { [field]: false };
    default:
      return null;
  }
}
