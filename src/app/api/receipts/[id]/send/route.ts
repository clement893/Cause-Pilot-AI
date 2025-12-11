import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { TaxReceiptDocument } from "@/lib/receipt-pdf";
import { sendEmail } from "@/lib/sendgrid";
import React, { ReactElement } from "react";
import { DocumentProps } from "@react-pdf/renderer";

// POST - Envoyer le reçu par email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { email: customEmail } = body;

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
        { error: "Impossible d'envoyer un reçu annulé" },
        { status: 400 }
      );
    }

    const recipientEmail = customEmail || receipt.donorEmail;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Aucune adresse email disponible pour ce donateur" },
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
      React.createElement(TaxReceiptDocument, { data: receiptData }) as unknown as ReactElement<DocumentProps>
    );

    // Formater le montant
    const formattedAmount = new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: receipt.country === "FR" ? "EUR" : "CAD",
    }).format(receipt.amount);

    // Préparer le contenu de l'email
    const emailSubject =
      orgSettings?.receiptEmailSubject ||
      `Votre reçu fiscal - ${receipt.receiptNumber}`;

    const emailBody =
      orgSettings?.receiptEmailBody ||
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Merci pour votre générosité !</h2>
        
        <p>Cher(e) ${receipt.donorName},</p>
        
        <p>Nous vous remercions sincèrement pour votre don de <strong>${formattedAmount}</strong> 
        effectué le ${new Date(receipt.donationDate).toLocaleDateString("fr-CA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}.</p>
        
        <p>Vous trouverez ci-joint votre reçu fiscal officiel (n° ${receipt.receiptNumber}) 
        pour vos déclarations d'impôts.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Numéro de reçu :</strong> ${receipt.receiptNumber}</p>
          <p style="margin: 5px 0 0;"><strong>Montant :</strong> ${formattedAmount}</p>
        </div>
        
        <p>Votre soutien nous permet de poursuivre notre mission et d'avoir un impact positif 
        dans notre communauté.</p>
        
        <p>Conservez ce reçu précieusement pour vos dossiers fiscaux.</p>
        
        <p>Avec toute notre gratitude,<br>
        <strong>${orgSettings?.organizationName || "L'équipe"}</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6b7280;">
          Ce reçu est un document officiel aux fins de l'impôt sur le revenu.
          ${orgSettings?.charityNumber ? `N° d'organisme de bienfaisance : ${orgSettings.charityNumber}` : ""}
        </p>
      </div>
    `;

    // Envoyer l'email avec le PDF en pièce jointe
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
      attachments: [
        {
          content: Buffer.from(pdfBuffer).toString("base64"),
          filename: `recu-fiscal-${receipt.receiptNumber}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email", details: emailResult.error },
        { status: 500 }
      );
    }

    // Mettre à jour le statut du reçu
    await prisma.taxReceipt.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentTo: recipientEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reçu envoyé avec succès à ${recipientEmail}`,
    });
  } catch (error) {
    console.error("Send receipt error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du reçu" },
      { status: 500 }
    );
  }
}
