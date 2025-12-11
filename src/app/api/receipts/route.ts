import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des reçus fiscaux
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get("donorId");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (donorId) {
      where.donorId = donorId;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (status) {
      where.status = status;
    }

    const [receipts, total] = await Promise.all([
      prisma.taxReceipt.findMany({
        where,
        include: {
          donor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          donation: {
            select: {
              id: true,
              amount: true,
              donationDate: true,
              campaignName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.taxReceipt.count({ where }),
    ]);

    return NextResponse.json({
      receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get receipts error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des reçus" },
      { status: 500 }
    );
  }
}

// POST - Générer un nouveau reçu fiscal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, sendEmail = true } = body;

    // Récupérer le don avec les informations du donateur
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: true,
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Don non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un reçu existe déjà pour ce don
    const existingReceipt = await prisma.taxReceipt.findFirst({
      where: {
        donationId,
        status: { not: "VOIDED" },
      },
    });

    if (existingReceipt) {
      return NextResponse.json(
        { error: "Un reçu existe déjà pour ce don", receipt: existingReceipt },
        { status: 400 }
      );
    }

    // Récupérer les paramètres de l'organisation
    const orgSettings = await prisma.organizationSettings.findFirst();

    // Vérifier le montant minimum
    if (orgSettings?.minimumReceiptAmount && donation.amount < orgSettings.minimumReceiptAmount) {
      return NextResponse.json(
        { error: `Le montant minimum pour émettre un reçu est de ${orgSettings.minimumReceiptAmount}$` },
        { status: 400 }
      );
    }

    // Générer le numéro de reçu séquentiel
    const year = new Date().getFullYear();
    const lastReceipt = await prisma.taxReceipt.findFirst({
      where: { year },
      orderBy: { sequenceNumber: "desc" },
    });

    const sequenceNumber = (lastReceipt?.sequenceNumber || 0) + 1;
    const prefix = orgSettings?.receiptPrefix || "";
    const receiptNumber = `${prefix}${year}-${String(sequenceNumber).padStart(6, "0")}`;

    // Créer le reçu
    const receipt = await prisma.taxReceipt.create({
      data: {
        receiptNumber,
        year,
        sequenceNumber,
        donationId: donation.id,
        donorId: donation.donorId,
        donorName: `${donation.donor.firstName} ${donation.donor.lastName}`,
        donorAddress: [
          donation.donor.address,
          donation.donor.city,
          donation.donor.state,
          donation.donor.postalCode,
          donation.donor.country,
        ]
          .filter(Boolean)
          .join(", "),
        donorEmail: donation.donor.email,
        amount: donation.amount,
        donationDate: donation.donationDate,
        country: donation.donor.country === "France" ? "FR" : "CA",
        status: "GENERATED",
      },
      include: {
        donor: true,
        donation: true,
      },
    });

    // Générer le PDF (sera fait dans une étape suivante)
    // Pour l'instant, on retourne le reçu créé

    // Envoyer par email si demandé
    if (sendEmail && receipt.donorEmail && orgSettings?.autoSendReceipts) {
      // L'envoi sera implémenté dans la phase 3
    }

    return NextResponse.json({
      success: true,
      receipt,
      message: "Reçu fiscal généré avec succès",
    });
  } catch (error) {
    console.error("Generate receipt error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du reçu" },
      { status: 500 }
    );
  }
}
