import sgMail from "@sendgrid/mail";

// Initialiser SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY n'est pas configuré");
    throw new Error("Configuration email manquante");
  }

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || "hello@nukleo.digital",
      name: process.env.SENDGRID_FROM_NAME || "CausePilotAI",
    },
    subject,
    text: text || html.replace(/<[^>]*>/g, ""), // Extraire le texte du HTML si pas fourni
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email envoyé à ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    if (error.response) {
      console.error("Détails SendGrid:", error.response.body);
    }
    throw error;
  }
}

export async function sendInvitationEmail({
  email,
  token,
  inviteType,
  organizationName,
  role,
  invitedByName,
}: {
  email: string;
  token: string;
  inviteType: "admin" | "organization";
  organizationName?: string;
  role?: string;
  invitedByName?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://web-production-4c73d.up.railway.app";
  const acceptUrl = `${baseUrl}/super-admin/invite/accept?token=${token}`;

  const subject = inviteType === "admin" 
    ? `Invitation à rejoindre CausePilot AI en tant qu'administrateur`
    : `Invitation à rejoindre ${organizationName} sur CausePilot AI`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation CausePilot AI</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">CausePilot AI</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Vous avez été invité !</h2>
        
        ${invitedByName ? `<p style="color: #6b7280;">Bonjour,</p><p style="color: #6b7280;"><strong>${invitedByName}</strong> vous a invité à rejoindre CausePilot AI.</p>` : '<p style="color: #6b7280;">Bonjour,</p><p style="color: #6b7280;">Vous avez été invité à rejoindre CausePilot AI.</p>'}
        
        ${inviteType === "admin" ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
            <p style="margin: 0; color: #374151;"><strong>Rôle:</strong> ${role || "Administrateur"}</p>
            <p style="margin: 10px 0 0 0; color: #6b7280;">Vous aurez accès à l'administration de la plateforme.</p>
          </div>
        ` : `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <p style="margin: 0; color: #374151;"><strong>Organisation:</strong> ${organizationName}</p>
            <p style="margin: 10px 0 0 0; color: #6b7280;">Vous aurez accès à cette organisation sur la plateforme.</p>
          </div>
        `}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Accepter l'invitation
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
          Ou copiez ce lien dans votre navigateur :<br>
          <a href="${acceptUrl}" style="color: #6366f1; word-break: break-all;">${acceptUrl}</a>
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Cette invitation expire dans 7 jours.<br>
            Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>CausePilot AI © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
