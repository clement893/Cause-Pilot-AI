import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer un segment avec ses donateurs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const segment = await prisma.donorSegment.findUnique({
      where: { id },
    });

    if (!segment) {
      return NextResponse.json(
        { error: "Segment non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les donateurs du segment
    let donors = [];
    if (segment.type === "DYNAMIC" && segment.rules) {
      const rules = JSON.parse(segment.rules);
      const where = buildWhereClause(rules);
      donors = await prisma.donor.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          totalDonated: true,
          donationCount: true,
          lastDonationDate: true,
          segment: true,
          isRecurring: true,
          status: true,
        },
        orderBy: { totalDonated: "desc" },
        take: 100,
      });
    } else if (segment.type === "STATIC") {
      const memberships = await prisma.donorSegmentMembership.findMany({
        where: { segmentId: id },
        select: { donorId: true },
      });
      const donorIds = memberships.map((m) => m.donorId);
      donors = await prisma.donor.findMany({
        where: { id: { in: donorIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          totalDonated: true,
          donationCount: true,
          lastDonationDate: true,
          segment: true,
          isRecurring: true,
          status: true,
        },
        orderBy: { totalDonated: "desc" },
      });
    }

    // Calculer les statistiques
    const stats = {
      donorCount: donors.length,
      totalValue: donors.reduce((sum, d) => sum + d.totalDonated, 0),
      avgDonation: donors.length > 0
        ? donors.reduce((sum, d) => sum + d.totalDonated, 0) / donors.length
        : 0,
      recurringCount: donors.filter((d) => d.isRecurring).length,
    };

    return NextResponse.json({
      ...segment,
      donors,
      stats,
    });
  } catch (error) {
    console.error("Get segment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du segment" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un segment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier si c'est un segment système
    const existing = await prisma.donorSegment.findUnique({
      where: { id },
    });

    if (existing?.isSystem) {
      return NextResponse.json(
        { error: "Les segments système ne peuvent pas être modifiés" },
        { status: 403 }
      );
    }

    const segment = await prisma.donorSegment.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
        icon: body.icon,
        rules: body.rules ? JSON.stringify(body.rules) : undefined,
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Update segment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du segment" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si c'est un segment système
    const existing = await prisma.donorSegment.findUnique({
      where: { id },
    });

    if (existing?.isSystem) {
      return NextResponse.json(
        { error: "Les segments système ne peuvent pas être supprimés" },
        { status: 403 }
      );
    }

    await prisma.donorSegment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete segment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du segment" },
      { status: 500 }
    );
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
