import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { TaxReceiptDocument } from "@/lib/receipt-pdf";
import React from "react";

// GET - Générer et télécharger le PDF du reçu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer le reçu avec toutes les informations
    const receipt = await prisma.taxReceipt.findUnique({
      where: { id },
      include: {
        donor: true,
        donation: true,
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Reçu non trouvé" },
        { status: 404 }
      );
    }

    if (receipt.status === "VOIDED") {
      return NextResponse.json(
        { error: "Ce reçu a été annulé" },
        { status: 400 }
      );
    }

    // Récupérer les paramètres de l'organisation
    const orgSettings = await prisma.organizationSettings.findFirst();

    // Préparer les données pour le PDF
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      issueDate: receipt.issueDate,
      donorName: receipt.donorName,
      donorEmail: receipt.donorEmail || "",
      donorAddress: receipt.donorAddress || undefined,
      donorCity: receipt.donor.city || undefined,
      donorPostalCode: receipt.donor.postalCode || undefined,
      donorCountry: receipt.donor.country || undefined,
      amount: receipt.amount,
      currency: receipt.country === "FR" ? "EUR" : "CAD",
      donationDate: receipt.donationDate,
      paymentMethod: receipt.donation.paymentMethod || "Carte de crédit",
      transactionId: receipt.donation.transactionId || undefined,
      campaignName: receipt.donation.campaignName || undefined,
      orgName: orgSettings?.organizationName || "Organisation",
      orgAddress: orgSettings?.address || undefined,
      orgCity: orgSettings?.city || undefined,
      orgPostalCode: orgSettings?.postalCode || undefined,
      orgCountry: orgSettings?.country || undefined,
      orgPhone: orgSettings?.phone || undefined,
      orgEmail: orgSettings?.email || undefined,
      orgWebsite: orgSettings?.website || undefined,
      orgCharityNumber: orgSettings?.charityNumber || undefined,
      orgLogoUrl: orgSettings?.logoUrl || undefined,
      taxYear: receipt.year,
      isEligibleForTaxReceipt: true,
    };

    // Générer le PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(TaxReceiptDocument, { data: receiptData })
    );

    // Mettre à jour le statut si c'est un téléchargement
    if (receipt.status === "GENERATED") {
      await prisma.taxReceipt.update({
        where: { id },
        data: { status: "DOWNLOADED" },
      });
    }

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recu-${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate PDF error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
