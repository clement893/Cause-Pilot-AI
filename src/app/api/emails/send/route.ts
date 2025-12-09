import { NextRequest, NextResponse } from "next/server";
import { sendEmail, sendBulkEmails, EmailOptions } from "@/lib/sendgrid";
import { prisma } from "@/lib/prisma";

// POST - Send email(s)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipients, templateId, subject, content, campaignId, fromEmail, fromName } = body;

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Au moins un destinataire est requis" },
        { status: 400 }
      );
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

    // Prepare email options
    const emailOptions: EmailOptions[] = recipients.map((recipient: { email: string; name?: string; variables?: Record<string, string> }) => {
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

      // Replace common variables
      htmlContent = htmlContent
        .replace(/{{firstName}}/g, recipient.name?.split(" ")[0] || "")
        .replace(/{{lastName}}/g, recipient.name?.split(" ").slice(1).join(" ") || "")
        .replace(/{{email}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"));

      textContent = textContent
        .replace(/{{firstName}}/g, recipient.name?.split(" ")[0] || "")
        .replace(/{{lastName}}/g, recipient.name?.split(" ").slice(1).join(" ") || "")
        .replace(/{{email}}/g, recipient.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString("fr-CA"));

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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "SEND_EMAIL",
        module: "marketing",
        entityType: "Email",
        entityId: campaignId || "manual",
        description: `${result.success} email(s) envoyé(s), ${result.failed} échec(s)`,
        metadata: JSON.stringify({
          recipientCount: recipients.length,
          templateId,
          campaignId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      sent: result.success,
      failed: result.failed,
      total: recipients.length,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des emails" },
      { status: 500 }
    );
  }
}
