import { NextRequest, NextResponse } from "next/server";
import { sendEmail, sendBulkEmails, EmailOptions } from "@/lib/sendgrid";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Generate unsubscribe token for a donor
function generateUnsubscribeToken(donorId: string, email: string): string {
  const secret = process.env.JWT_SECRET || "default-secret";
  const data = `${donorId}:${email}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// Generate unsubscribe URL
function getUnsubscribeUrl(donorId: string, email: string): string {
  const token = generateUnsubscribeToken(donorId, email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://web-production-4c73d.up.railway.app";
  return `${baseUrl}/unsubscribe?token=${token}&email=${encodeURIComponent(email)}`;
}

// POST - Send email(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipients, templateId, subject, content, campaignId, fromEmail, fromName, skipConsentCheck } = body;
    
    // Track excluded recipients for consent
    let excludedForConsent: string[] = [];

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Au moins un destinataire est requis" },
        { status: 400 }
      );
    }
    
    // Filter recipients based on email consent (RGPD compliance)
    let filteredRecipients = recipients;
    if (!skipConsentCheck) {
      const emails = recipients.map((r: { email: string }) => r.email);
      const donorsWithConsent = await prisma.donor.findMany({
        where: {
          email: { in: emails },
          consentEmail: true,
          optOutDate: null,
        },
        select: { email: true, id: true },
      });
      
      const consentedEmails = new Set(donorsWithConsent.map(d => d.email));
      
      // Separate recipients with and without consent
      filteredRecipients = recipients.filter((r: { email: string }) => consentedEmails.has(r.email));
      excludedForConsent = recipients
        .filter((r: { email: string }) => !consentedEmails.has(r.email))
        .map((r: { email: string }) => r.email);
      
      if (filteredRecipients.length === 0) {
        return NextResponse.json(
          { 
            error: "Aucun destinataire n'a donné son consentement pour recevoir des emails",
            excludedForConsent,
          },
          { status: 400 }
        );
      }
    }

    if (!subject && !templateId) {
      return NextResponse.json(
        { error: "Un sujet ou un template est requis" },
        { status: 400 }
      );
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template non trouvé" },
          { status: 404 }
        );
      }
    }

    // Get donor IDs for unsubscribe links
    const recipientEmails = filteredRecipients.map((r: { email: string }) => r.email);
    const donorMap = new Map<string, string>();
    const donors = await prisma.donor.findMany({
      where: { email: { in: recipientEmails } },
      select: { id: true, email: true },
    });
    donors.forEach(d => {
      if (d.email) donorMap.set(d.email, d.id);
    });
    
    // Prepare email options
    const emailOptions: EmailOptions[] = filteredRecipients.map((recipient: { email: string; name?: string; variables?: Record<string, string> }) => {
      let htmlContent = template?.htmlContent || content?.html || "";
      let textContent = template?.textContent || content?.text || "";
      const emailSubject = template?.subject || subject;

      // Replace variables in template
      if (recipient.variables) {
        Object.entries(recipient.variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, "g");
          htmlContent = htmlContent.replace(regex, value);
          textContent = textContent.replace(regex, value);
        });
      }

      // Generate unsubscribe link for this recipient
      const donorId = donorMap.get(recipient.email) || "unknown";
      const unsubscribeUrl = getUnsubscribeUrl(donorId, recipient.email);
      
      // Replace common variables
      htmlContent = htmlContent
        .replace(/{{firstName}}/g, recipient.name?.split(" ")[0] || "")
        .replace(/{{lastName}}/g, recipient.name?.split(" ").slice(1).join(" ") || "")
        .replace(/{{email}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"))
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);
      
      // Add unsubscribe footer if not present
      if (!htmlContent.includes(unsubscribeUrl) && !htmlContent.includes("{{unsubscribeUrl}}")) {
        htmlContent += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666;">
            <p>Vous recevez cet email car vous avez donné votre consentement pour recevoir nos communications.</p>
            <p><a href="${unsubscribeUrl}" style="color: #666;">Se désabonner</a></p>
          </div>
        `;
      }

      textContent = textContent
        .replace(/{{firstName}}/g, recipient.name?.split(" ")[0] || "")
        .replace(/{{lastName}}/g, recipient.name?.split(" ").slice(1).join(" ") || "")
        .replace(/{{email}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"))
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);
      
      // Add unsubscribe footer to text version
      if (!textContent.includes(unsubscribeUrl)) {
        textContent += `\n\n---\nPour vous désabonner: ${unsubscribeUrl}`;
      }

      return {
        to: recipient.email,
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
        from: fromEmail ? { email: fromEmail, name: fromName } : undefined,
        categories: campaignId ? ["campaign", campaignId] : ["manual"],
        customArgs: {
          campaignId: campaignId || "",
          templateId: templateId || "",
        },
      };
    });

    // Send emails
    let result;
    if (emailOptions.length === 1) {
      const success = await sendEmail(emailOptions[0]);
      result = { success: success ? 1 : 0, failed: success ? 0 : 1 };
    } else {
      result = await sendBulkEmails(emailOptions);
    }

    // Log the send operation
    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          sentCount: { increment: result.success },
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    // TODO: Audit log - modèle à créer
    // await prisma.auditLog.create({
    //   data: {
    //     action: "SEND_EMAIL",
    //     module: "marketing",
    //     entityType: "Email",
    //     entityId: campaignId || "manual",
    //     description: `${result.success} email(s) envoyé(s), ${result.failed} échec(s)`,
    //     metadata: JSON.stringify({
    //       recipientCount: recipients.length,
    //       templateId,
    //       campaignId,
    //     }),
    //   },
    // });

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: filteredRecipients.length,
      excludedForConsent: excludedForConsent.length,
      excludedEmails: excludedForConsent,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails" },
      { status: 500 }
    );
  }
}
