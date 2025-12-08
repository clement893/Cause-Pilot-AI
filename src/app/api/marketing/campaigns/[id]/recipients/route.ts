import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des destinataires d'une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Record<string, unknown> = { campaignId: id };
    if (status) where.status = status;

    const recipients = await prisma.emailRecipient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json(recipients);
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des destinataires" },
      { status: 500 }
    );
  }
}

// POST - Ajouter des destinataires à une campagne
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { recipients } = body;

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: "Liste de destinataires invalide" },
        { status: 400 }
      );
    }

    // Créer les destinataires
    const created = await prisma.emailRecipient.createMany({
      data: recipients.map((r: { email: string; firstName?: string; lastName?: string; donorId?: string }) => ({
        campaignId: id,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
        donorId: r.donorId,
        status: "PENDING",
      })),
      skipDuplicates: true,
    });

    // Mettre à jour le compteur de la campagne
    const totalRecipients = await prisma.emailRecipient.count({
      where: { campaignId: id },
    });

    await prisma.emailCampaign.update({
      where: { id },
      data: { totalRecipients },
    });

    return NextResponse.json({ created: created.count, total: totalRecipients });
  } catch (error) {
    console.error("Error adding recipients:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout des destinataires" },
      { status: 500 }
    );
  }
}
