import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { TaxReceiptDocument, ReceiptData } from "@/lib/receipt-pdf";
import React from "react";

// GET - Générer et télécharger le reçu fiscal PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> }
) {
  try {
    const { donationId } = await params;

    // Récupérer le don avec les informations du donateur et de la campagne
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

    if (!donation.donor) {
      return NextResponse.json(
        { error: "Donateur non trouvé pour ce don" },
        { status: 404 }
      );
    }

    // Récupérer les paramètres de l'organisation
    const orgSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "org_name",
            "org_address",
            "org_city",
            "org_postal_code",
            "org_country",
            "org_phone",
            "org_email",
            "org_website",
            "org_charity_number",
            "org_logo_url",
          ],
        },
      },
    });

    const settings: Record<string, string> = {};
    orgSettings.forEach((s) => {
      settings[s.key] = s.value;
    });

    // Générer le numéro de reçu
    const year = new Date(donation.donationDate).getFullYear();
    const receiptNumber = `REC-${year}-${donation.id.slice(-8).toUpperCase()}`;

    // Préparer les données du reçu
    const receiptData: ReceiptData = {
      receiptNumber,
      issueDate: new Date(),
      
      // Donor info
      donorName: `${donation.donor.firstName} ${donation.donor.lastName}`,
      donorEmail: donation.donor.email || "",
      donorAddress: donation.donor.address || undefined,
      donorCity: donation.donor.city || undefined,
      donorPostalCode: donation.donor.postalCode || undefined,
      donorCountry: donation.donor.country || undefined,
      
      // Donation info
      amount: donation.amount,
      currency: donation.currency || "CAD",
      donationDate: donation.donationDate,
      paymentMethod: formatPaymentMethod(donation.paymentMethod),
      transactionId: donation.transactionId || undefined,
      campaignName: donation.campaignName || undefined,
      
      // Organization info
      orgName: settings.org_name || "Votre Organisation",
      orgAddress: settings.org_address || undefined,
      orgCity: settings.org_city || undefined,
      orgPostalCode: settings.org_postal_code || undefined,
      orgCountry: settings.org_country || undefined,
      orgPhone: settings.org_phone || undefined,
      orgEmail: settings.org_email || undefined,
      orgWebsite: settings.org_website || undefined,
      orgCharityNumber: settings.org_charity_number || undefined,
      orgLogoUrl: settings.org_logo_url || undefined,
      
      // Tax info
      taxYear: year,
      isEligibleForTaxReceipt: true,
    };

    // Générer le PDF
    const pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(TaxReceiptDocument, { data: receiptData }) as any
    );

    // Mettre à jour le don pour indiquer que le reçu a été généré
    await prisma.donation.update({
      where: { id: donationId },
      data: {
        receiptNumber,
        receiptSentAt: new Date(),
      },
    });

    // Retourner le PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recu-fiscal-${receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du reçu" },
      { status: 500 }
    );
  }
}

function formatPaymentMethod(method: string | null): string {
  const methods: Record<string, string> = {
    CREDIT_CARD: "Carte de crédit",
    DEBIT_CARD: "Carte de débit",
    BANK_TRANSFER: "Virement bancaire",
    PAYPAL: "PayPal",
    CHECK: "Chèque",
    CASH: "Espèces",
    OTHER: "Autre",
  };
  return methods[method || "OTHER"] || "Non spécifié";
}
