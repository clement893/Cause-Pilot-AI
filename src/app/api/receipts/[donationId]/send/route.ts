import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { TaxReceiptDocument, ReceiptData } from "@/lib/receipt-pdf";
import { sendEmail } from "@/lib/sendgrid";
import React from "react";

// POST - Envoyer le reçu fiscal par email
export async function POST(
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
    const receiptNumber = donation.receiptNumber || `REC-${year}-${donation.id.slice(-8).toUpperCase()}`;

    // Préparer les données du reçu
    const receiptData: ReceiptData = {
      receiptNumber,
      issueDate: new Date(),
      
      donorName: `${donation.donor.firstName} ${donation.donor.lastName}`,
      donorEmail: donation.donor.email || "",
      donorAddress: donation.donor.address || undefined,
      donorCity: donation.donor.city || undefined,
      donorPostalCode: donation.donor.postalCode || undefined,
      donorCountry: donation.donor.country || undefined,
      
      amount: donation.amount,
      currency: donation.currency || "CAD",
      donationDate: donation.donationDate,
      paymentMethod: formatPaymentMethod(donation.paymentMethod),
      transactionId: donation.transactionId || undefined,
      campaignName: donation.campaignName || undefined,
      
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
      
      taxYear: year,
      isEligibleForTaxReceipt: true,
    };

    // Générer le PDF
    const pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(TaxReceiptDocument, { data: receiptData }) as any
    );

    // Convertir le buffer en base64 pour l'attachement
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Envoyer l'email avec le reçu en pièce jointe
    const orgName = settings.org_name || "Votre Organisation";
    const formattedAmount = new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: donation.currency || "CAD",
    }).format(donation.amount);

    await sendEmail({
      to: donation.donor.email || "",
      subject: `Votre reçu fiscal - Don de ${formattedAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Merci pour votre don!</h1>
          <p>Cher(e) ${donation.donor.firstName},</p>
          <p>Nous vous remercions sincèrement pour votre généreux don de <strong>${formattedAmount}</strong>.</p>
          <p>Veuillez trouver ci-joint votre reçu fiscal officiel (N° ${receiptNumber}) pour vos déclarations d'impôts.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Montant:</strong> ${formattedAmount}</p>
            <p style="margin: 10px 0 0;"><strong>Date:</strong> ${new Date(donation.donationDate).toLocaleDateString("fr-CA")}</p>
            <p style="margin: 10px 0 0;"><strong>N° de reçu:</strong> ${receiptNumber}</p>
          </div>
          <p>Votre soutien fait une réelle différence et nous permet de poursuivre notre mission.</p>
          <p>Cordialement,<br/><strong>${orgName}</strong></p>
        </div>
      `,
      attachments: [
        {
          content: pdfBase64,
          filename: `recu-fiscal-${receiptNumber}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    // Mettre à jour le don
    await prisma.donation.update({
      where: { id: donationId },
      data: {
        receiptNumber,
        receiptSentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reçu envoyé avec succès",
      receiptNumber,
    });
  } catch (error) {
    console.error("Receipt send error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du reçu" },
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
