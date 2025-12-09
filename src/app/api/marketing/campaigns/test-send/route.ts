import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendgrid";

interface TestSendRequest {
  testEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName?: string;
  fromEmail?: string;
  preheader?: string;
}

// POST - Envoyer un email de test
export async function POST(request: NextRequest) {
  try {
    const body: TestSendRequest = await request.json();
    const { testEmail, subject, htmlContent, textContent, fromName, preheader } = body;

    // Validation
    if (!testEmail || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "Email de test, sujet et contenu sont requis" },
        { status: 400 }
      );
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // Remplacer les variables de test
    const testData = {
      firstName: "Prénom",
      lastName: "Nom",
      email: testEmail,
      date: new Date().toLocaleDateString("fr-CA"),
    };

    let personalizedHtml = htmlContent;
    let personalizedText = textContent || "";

    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      personalizedHtml = personalizedHtml.replace(regex, value);
      personalizedText = personalizedText.replace(regex, value);
    });

    // Ajouter un bandeau de test
    const testBanner = `
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
        <strong style="color: #92400e;">🧪 CECI EST UN EMAIL DE TEST</strong>
        <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">
          Les variables ont été remplacées par des valeurs de démonstration.
        </p>
      </div>
    `;

    // Insérer le bandeau après le body tag ou au début
    if (personalizedHtml.includes("<body")) {
      personalizedHtml = personalizedHtml.replace(
        /(<body[^>]*>)/i,
        `$1${testBanner}`
      );
    } else {
      personalizedHtml = testBanner + personalizedHtml;
    }

    // Envoyer l'email de test
    const result = await sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html: personalizedHtml,
      text: `[TEST] ${personalizedText}`,
      from: fromName ? {
        email: process.env.SENDGRID_FROM_EMAIL || "hello@nukleo.digital",
        name: fromName,
      } : undefined,
      categories: ["test", "campaign-preview"],
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: `Email de test envoyé à ${testEmail}`,
      });
    } else {
      return NextResponse.json(
        { error: "Échec de l'envoi de l'email de test" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email de test" },
      { status: 500 }
    );
  }
}
