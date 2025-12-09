import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendgrid";

// POST - Send test email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, templateId, subject, content } = body;

    if (!to) {
      return NextResponse.json(
        { error: "L'adresse email de destination est requise" },
        { status: 400 }
      );
    }

    // Send test email
    const success = await sendEmail({
      to,
      subject: subject || "Email de test - Nucleus Cause",
      html: content?.html || `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Test d'envoi d'email</h1>
            </div>
            <div class="content">
              <div class="success">
                ✅ L'intégration SendGrid fonctionne correctement !
              </div>
              <p>Cet email confirme que votre configuration SendGrid est opérationnelle.</p>
              <p>Vous pouvez maintenant envoyer des emails depuis Nucleus Cause.</p>
              <p><strong>Date du test :</strong> ${new Date().toLocaleString("fr-CA")}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: content?.text || `
Test d'envoi d'email - Nucleus Cause

L'intégration SendGrid fonctionne correctement !

Cet email confirme que votre configuration SendGrid est opérationnelle.
Vous pouvez maintenant envoyer des emails depuis Nucleus Cause.

Date du test : ${new Date().toLocaleString("fr-CA")}
      `,
      categories: ["test"],
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Email de test envoyé à ${to}`,
      });
    } else {
      return NextResponse.json(
        { error: "Échec de l'envoi de l'email. Vérifiez la configuration SendGrid." },
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
