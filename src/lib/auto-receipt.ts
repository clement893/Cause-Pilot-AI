import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { TaxReceiptDocument } from "@/lib/receipt-pdf";
import { sendEmail } from "@/lib/sendgrid";
import React, { ReactElement } from "react";
import { DocumentProps } from "@react-pdf/renderer";

interface GenerateReceiptOptions {
  donationId: string;
  sendEmail?: boolean;
}

interface GenerateReceiptResult {
  success: boolean;
  receiptId?: string;
  receiptNumber?: string;
  error?: string;
}

/**
 * Génère automatiquement un reçu fiscal pour un don
 * et l'envoie par email si demandé
 */
export async function generateReceiptForDonation(
  options: GenerateReceiptOptions
): Promise<GenerateReceiptResult> {
  const { donationId, sendEmail: shouldSendEmail = true } = options;

  try {
    // Récupérer le don avec les informations du donateur
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: true,
      },
    });

    if (!donation) {
      return { success: false, error: "Don non trouvé" };
    }

    // Vérifier si un reçu existe déjà pour ce don
    const existingReceipt = await prisma.taxReceipt.findFirst({
      where: {
        donationId,
        status: { not: "VOIDED" },
      },
    });

    if (existingReceipt) {
      return {
        success: true,
        receiptId: existingReceipt.id,
        receiptNumber: existingReceipt.receiptNumber,
      };
    }

    // Récupérer les paramètres de l'organisation
    const orgSettings = await prisma.organizationSettings.findFirst();

    // Vérifier le montant minimum
    if (
      orgSettings?.minimumReceiptAmount &&
      donation.amount < orgSettings.minimumReceiptAmount
    ) {
      return {
        success: false,
        error: `Montant inférieur au minimum requis (${orgSettings.minimumReceiptAmount}$)`,
      };
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
    });

    // Envoyer par email si demandé et si l'email est disponible
    if (
      shouldSendEmail &&
      donation.donor.email &&
      orgSettings?.autoSendReceipts !== false
    ) {
      try {
        await sendReceiptEmail(receipt.id);
      } catch (emailError) {
        console.error("Erreur envoi email reçu:", emailError);
        // On ne fait pas échouer la génération si l'email échoue
      }
    }

    return {
      success: true,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
    };
  } catch (error) {
    console.error("Erreur génération reçu:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Envoie un reçu fiscal par email
 */
async function sendReceiptEmail(receiptId: string): Promise<boolean> {
  const receipt = await prisma.taxReceipt.findUnique({
    where: { id: receiptId },
    include: {
      donor: true,
      donation: true,
    },
  });

  if (!receipt || !receipt.donorEmail) {
    return false;
  }

  const orgSettings = await prisma.organizationSettings.findFirst();

  // Préparer les données pour le PDF
  const receiptData = {
    receiptNumber: receipt.receiptNumber,
    issueDate: receipt.issueDate,
    donorName: receipt.donorName,
    donorEmail: receipt.donorEmail,
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
    React.createElement(TaxReceiptDocument, { data: receiptData }) as unknown as ReactElement<DocumentProps>
  );

  // Formater le montant
  const formattedAmount = new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: receipt.country === "FR" ? "EUR" : "CAD",
  }).format(receipt.amount);

  // Envoyer l'email
  const emailResult = await sendEmail({
    to: receipt.donorEmail,
    subject: `Votre reçu fiscal - ${receipt.receiptNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Merci pour votre générosité !</h2>
        
        <p>Cher(e) ${receipt.donorName},</p>
        
        <p>Nous vous remercions sincèrement pour votre don de <strong>${formattedAmount}</strong>.</p>
        
        <p>Vous trouverez ci-joint votre reçu fiscal officiel (n° ${receipt.receiptNumber}).</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Numéro de reçu :</strong> ${receipt.receiptNumber}</p>
          <p style="margin: 5px 0 0;"><strong>Montant :</strong> ${formattedAmount}</p>
        </div>
        
        <p>Conservez ce reçu précieusement pour vos dossiers fiscaux.</p>
        
        <p>Avec toute notre gratitude,<br>
        <strong>${orgSettings?.organizationName || "L'équipe"}</strong></p>
      </div>
    `,
    attachments: [
      {
        content: Buffer.from(pdfBuffer).toString("base64"),
        filename: `recu-fiscal-${receipt.receiptNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  });

  if (emailResult.success) {
    await prisma.taxReceipt.update({
      where: { id: receiptId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentTo: receipt.donorEmail,
      },
    });
    return true;
  }

  return false;
}

/**
 * Génère les reçus annuels consolidés pour tous les donateurs
 */
export async function generateAnnualReceipts(year: number): Promise<{
  generated: number;
  errors: number;
}> {
  let generated = 0;
  let errors = 0;

  // Trouver tous les donateurs avec des dons cette année sans reçu annuel
  const donors = await prisma.donor.findMany({
    where: {
      donations: {
        some: {
          donationDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
          status: "COMPLETED",
        },
      },
    },
    include: {
      donations: {
        where: {
          donationDate: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`),
          },
          status: "COMPLETED",
        },
      },
    },
  });

  for (const donor of donors) {
    try {
      // Calculer le total des dons de l'année
      const totalAmount = donor.donations.reduce((sum, d) => sum + d.amount, 0);

      if (totalAmount <= 0) continue;

      // Générer le numéro de reçu
      const lastReceipt = await prisma.taxReceipt.findFirst({
        where: { year },
        orderBy: { sequenceNumber: "desc" },
      });

      const sequenceNumber = (lastReceipt?.sequenceNumber || 0) + 1;
      const receiptNumber = `${year}-${String(sequenceNumber).padStart(6, "0")}`;

      // Créer le reçu annuel
      await prisma.taxReceipt.create({
        data: {
          receiptNumber,
          year,
          sequenceNumber,
          donationId: donor.donations[0].id, // Référence au premier don
          donorId: donor.id,
          donorName: `${donor.firstName} ${donor.lastName}`,
          donorAddress: [
            donor.address,
            donor.city,
            donor.state,
            donor.postalCode,
            donor.country,
          ]
            .filter(Boolean)
            .join(", "),
          donorEmail: donor.email,
          amount: totalAmount,
          donationDate: new Date(`${year}-12-31`),
          receiptType: "ANNUAL",
          country: donor.country === "France" ? "FR" : "CA",
          status: "GENERATED",
        },
      });

      generated++;
    } catch (error) {
      console.error(`Erreur reçu annuel pour ${donor.id}:`, error);
      errors++;
    }
  }

  return { generated, errors };
}
