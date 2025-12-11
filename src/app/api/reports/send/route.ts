import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendgrid";

// POST - Envoyer un rapport par email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, year, month, recipients, subject, message } = body;

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Au moins un destinataire est requis" },
        { status: 400 }
      );
    }

    // Récupérer les données du rapport
    const baseUrl = request.nextUrl.origin;
    const reportUrl = `${baseUrl}/api/reports?type=${type || "monthly"}&year=${year || new Date().getFullYear()}&month=${month || new Date().getMonth() + 1}`;
    
    const reportResponse = await fetch(reportUrl);
    const reportData = await reportResponse.json();

    // Générer le PDF
    const pdfUrl = `${baseUrl}/api/reports/pdf?type=${type || "monthly"}&year=${year || new Date().getFullYear()}&month=${month || new Date().getMonth() + 1}`;
    
    const pdfResponse = await fetch(pdfUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Préparer le contenu de l'email
    const periodLabel = reportData.metadata?.period || `${type} ${year}`;
    const emailSubject = subject || `Rapport ${periodLabel} - Conseil d'Administration`;
    
    const emailContent = generateEmailContent(reportData, message);

    // Envoyer à chaque destinataire
    const results = [];
    for (const recipient of recipients) {
      const success = await sendEmail({
        to: recipient.email,
        subject: emailSubject,
        html: emailContent,
        attachments: [
          {
            content: pdfBase64,
            filename: `rapport-ca-${type}-${year}${month ? `-${month}` : ""}.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      });

      results.push({
        email: recipient.email,
        name: recipient.name,
        success,
      });
    }

    // Enregistrer l'envoi dans l'historique
    await prisma.notification.create({
      data: {
        type: "SYSTEM_ALERT",
        category: "SYSTEM",
        title: "Rapport envoyé au CA",
        message: `Rapport ${periodLabel} envoyé à ${recipients.length} membre(s) du CA`,
        priority: "LOW",
      },
    });

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Rapport envoyé à ${successCount}/${recipients.length} destinataire(s)`,
      results,
    });
  } catch (error) {
    console.error("Erreur envoi rapport:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du rapport" },
      { status: 500 }
    );
  }
}

interface ReportData {
  metadata?: {
    period?: string;
    year?: number;
    type?: string;
  };
  summary?: {
    totalRaised?: number;
    totalDonations?: number;
    totalDonors?: number;
    newDonors?: number;
    averageDonation?: number;
    retentionRate?: number;
  };
  yearOverYear?: {
    growthRate?: number;
  };
  highlights?: string[];
}

function generateEmailContent(reportData: ReportData, customMessage?: string): string {
  const summary = reportData.summary || {};
  const yearOverYear = reportData.yearOverYear || {};
  const highlights = reportData.highlights || [];
  const metadata = reportData.metadata || {};

  const growthRate = yearOverYear.growthRate || 0;
  const growthColor = growthRate >= 0 ? "#16a34a" : "#dc2626";
  const growthSign = growthRate >= 0 ? "+" : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport pour le Conseil d'Administration</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
          Rapport pour le Conseil
        </h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px;">
          ${metadata.period || "Période"}
        </p>
      </td>
    </tr>

    ${customMessage ? `
    <tr>
      <td style="padding: 25px 30px 0 30px;">
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
          ${customMessage}
        </p>
      </td>
    </tr>
    ` : ""}

    <!-- Résumé Exécutif -->
    <tr>
      <td style="padding: 25px 30px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Résumé Exécutif
        </h2>
        
        <table width="100%" cellpadding="0" cellspacing="10">
          <tr>
            <td width="50%" style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 5px 0; text-transform: uppercase;">Total Collecté</p>
              <p style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0;">
                ${formatCurrency(summary.totalRaised || 0)}
              </p>
              <p style="color: ${growthColor}; font-size: 12px; margin: 5px 0 0 0;">
                ${growthSign}${growthRate.toFixed(1)}% vs année précédente
              </p>
            </td>
            <td width="50%" style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 5px 0; text-transform: uppercase;">Donateurs Actifs</p>
              <p style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0;">
                ${summary.totalDonors || 0}
              </p>
              <p style="color: #16a34a; font-size: 12px; margin: 5px 0 0 0;">
                dont ${summary.newDonors || 0} nouveaux
              </p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 5px 0; text-transform: uppercase;">Nombre de Dons</p>
              <p style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0;">
                ${summary.totalDonations || 0}
              </p>
            </td>
            <td width="50%" style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 11px; margin: 0 0 5px 0; text-transform: uppercase;">Don Moyen</p>
              <p style="color: #1e293b; font-size: 24px; font-weight: 700; margin: 0;">
                ${formatCurrency(summary.averageDonation || 0)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${highlights.length > 0 ? `
    <tr>
      <td style="padding: 0 30px 25px 30px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">
          Points Saillants
        </h2>
        ${highlights.map(h => `
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 15px; margin-bottom: 10px; border-radius: 0 6px 6px 0;">
            <p style="color: #1e40af; font-size: 14px; margin: 0;">${h}</p>
          </div>
        `).join("")}
      </td>
    </tr>
    ` : ""}

    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 30px 30px; text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0;">
          Le rapport complet est disponible en pièce jointe (PDF).
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px;">
          <p style="color: #166534; font-size: 14px; margin: 0;">
            📎 <strong>rapport-ca-${metadata.type || "rapport"}-${metadata.year || ""}.pdf</strong>
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
          Ce rapport a été généré automatiquement par CausePilot AI.<br>
          Pour toute question, contactez l'équipe de développement.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
