import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer un reçu spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const receipt = await prisma.taxReceipt.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
        donation: {
          select: {
            id: true,
            amount: true,
            donationDate: true,
            campaignName: true,
            paymentMethod: true,
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Reçu non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Get receipt error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du reçu" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un reçu (annuler, renvoyer, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, userId } = body;

    const receipt = await prisma.taxReceipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Reçu non trouvé" },
        { status: 404 }
      );
    }

    if (action === "void") {
      // Annuler le reçu
      if (receipt.status === "VOIDED") {
        return NextResponse.json(
          { error: "Ce reçu est déjà annulé" },
          { status: 400 }
        );
      }

      const updatedReceipt = await prisma.taxReceipt.update({
        where: { id },
        data: {
          status: "VOIDED",
          voidedAt: new Date(),
          voidedBy: userId,
          voidReason: reason || "Annulé par l'administrateur",
        },
      });

      return NextResponse.json({
        success: true,
        receipt: updatedReceipt,
        message: "Reçu annulé avec succès",
      });
    }

    if (action === "resend") {
      // Renvoyer le reçu par email
      if (receipt.status === "VOIDED") {
        return NextResponse.json(
          { error: "Impossible de renvoyer un reçu annulé" },
          { status: 400 }
        );
      }

      // L'envoi sera implémenté dans la phase 3
      const updatedReceipt = await prisma.taxReceipt.update({
        where: { id },
        data: {
          sentAt: new Date(),
          status: "SENT",
        },
      });

      return NextResponse.json({
        success: true,
        receipt: updatedReceipt,
        message: "Reçu renvoyé avec succès",
      });
    }

    if (action === "download") {
      // Marquer comme téléchargé
      const updatedReceipt = await prisma.taxReceipt.update({
        where: { id },
        data: {
          status: receipt.status === "GENERATED" ? "DOWNLOADED" : receipt.status,
        },
      });

      return NextResponse.json({
        success: true,
        receipt: updatedReceipt,
      });
    }

    return NextResponse.json(
      { error: "Action non reconnue" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update receipt error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du reçu" },
      { status: 500 }
    );
  }
}
