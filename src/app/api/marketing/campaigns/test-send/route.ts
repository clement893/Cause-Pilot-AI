import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || "hello@nukleo.digital";
const fromName = process.env.SENDGRID_FROM_NAME || "CausePilotAI";

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

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

    // Vérifier la configuration SendGrid
    if (!sendgridApiKey) {
      console.error("SENDGRID_API_KEY not configured");
      return NextResponse.json(
        { error: "Configuration SendGrid manquante. Vérifiez que SENDGRID_API_KEY est configuré." },
        { status: 500 }
      );
    }

    // Envoyer l'email de test
    try {
      const msg = {
        to: testEmail,
        from: {
          email: fromEmail,
          name: body.fromName || fromName,
        },
        subject: `[TEST] ${subject}`,
        text: `[TEST] ${personalizedText}`,
        html: personalizedHtml,
        categories: ["test", "campaign-preview"],
      };

      await sgMail.send(msg);
      console.log(`Test email sent successfully to ${testEmail}`);

      return NextResponse.json({
        success: true,
        message: `Email de test envoyé à ${testEmail}`,
      });
    } catch (sendError: unknown) {
      console.error("SendGrid error:", sendError);
      const errorMessage = sendError instanceof Error ? sendError.message : "Erreur inconnue";
      
      // Vérifier si c'est une erreur d'authentification
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        return NextResponse.json(
          { error: "Clé API SendGrid invalide ou expirée" },
          { status: 500 }
        );
      }
      
      // Vérifier si c'est une erreur de sender non vérifié
      if (errorMessage.includes("sender") || errorMessage.includes("verified")) {
        return NextResponse.json(
          { error: "L'adresse d'expédition n'est pas vérifiée dans SendGrid" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Échec de l'envoi: ${errorMessage}` },
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
