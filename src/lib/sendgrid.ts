import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
} else {
  console.warn("SENDGRID_API_KEY is not set. Email sending will not work.");
}

// Get default sender with validation
function getDefaultFromEmail(): string {
  const email = process.env.SENDGRID_FROM_EMAIL;
  if (!email) {
    throw new Error("SENDGRID_FROM_EMAIL environment variable is required");
  }
  return email;
}

function getDefaultFromName(): string {
  return process.env.SENDGRID_FROM_NAME || "Nucleus Cause";
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  from?: {
    email: string;
    name?: string;
  };
  replyTo?: string;
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type: string;
    disposition?: "attachment" | "inline";
  }>;
  categories?: string[];
  customArgs?: Record<string, string>;
}

// Send a single email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!sendgridApiKey) {
    console.error("SendGrid API key not configured");
    return false;
  }

  try {
    const msg: sgMail.MailDataRequired = {
      to: options.to,
      from: {
        email: options.from?.email || getDefaultFromEmail(),
        name: options.from?.name || getDefaultFromName(),
      },
      subject: options.subject,
      text: options.text || "",
      html: options.html || options.text || "",
      replyTo: options.replyTo,
      attachments: options.attachments,
      categories: options.categories,
      customArgs: options.customArgs,
    };

    // Use dynamic template if provided
    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.dynamicTemplateData;
    }

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Send multiple emails (batch)
export async function sendBulkEmails(
  emails: EmailOptions[]
): Promise<{ success: number; failed: number }> {
  if (!sendgridApiKey) {
    console.error("SendGrid API key not configured");
    return { success: 0, failed: emails.length };
  }

  let success = 0;
  let failed = 0;

  // SendGrid recommends batching in groups of 1000
  const batchSize = 1000;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    const messages = batch.map((options) => ({
      to: options.to,
      from: {
        email: options.from?.email || getDefaultFromEmail(),
        name: options.from?.name || getDefaultFromName(),
      },
      subject: options.subject,
      text: options.text || "",
      html: options.html || options.text || "",
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData,
      categories: options.categories,
      customArgs: options.customArgs,
    }));

    try {
      await sgMail.send(messages as sgMail.MailDataRequired[]);
      success += batch.length;
    } catch (error) {
      console.error("Error sending batch emails:", error);
      failed += batch.length;
    }
  }

  return { success, failed };
}

// Pre-built email templates
export const EmailTemplates = {
  // Donation confirmation
  donationConfirmation: (data: {
    donorName: string;
    amount: number;
    campaignName?: string;
    transactionId: string;
    date: Date;
  }) => ({
    subject: "Merci pour votre don !",
    html: `
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
          .amount { font-size: 36px; font-weight: bold; color: #8B5CF6; text-align: center; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .details p { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Merci pour votre générosité !</h1>
          </div>
          <div class="content">
            <p>Cher(e) ${data.donorName},</p>
            <p>Nous avons bien reçu votre don et nous vous en remercions chaleureusement.</p>
            
            <div class="amount">${data.amount.toFixed(2)} $</div>
            
            <div class="details">
              <p><strong>Numéro de transaction :</strong> ${data.transactionId}</p>
              <p><strong>Date :</strong> ${data.date.toLocaleDateString("fr-CA")}</p>
              ${data.campaignName ? `<p><strong>Campagne :</strong> ${data.campaignName}</p>` : ""}
            </div>
            
            <p>Votre contribution fait une réelle différence et nous permet de poursuivre notre mission.</p>
            <p>Un reçu fiscal vous sera envoyé en début d'année prochaine.</p>
            
            <p>Avec toute notre gratitude,<br>L'équipe</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Merci pour votre don !

Cher(e) ${data.donorName},

Nous avons bien reçu votre don de ${data.amount.toFixed(2)} $ et nous vous en remercions chaleureusement.

Numéro de transaction : ${data.transactionId}
Date : ${data.date.toLocaleDateString("fr-CA")}
${data.campaignName ? `Campagne : ${data.campaignName}` : ""}

Votre contribution fait une réelle différence et nous permet de poursuivre notre mission.
Un reçu fiscal vous sera envoyé en début d'année prochaine.

Avec toute notre gratitude,
L'équipe
    `,
  }),

  // Welcome email for new donors
  welcomeDonor: (data: { donorName: string; organizationName: string }) => ({
    subject: `Bienvenue dans la communauté ${data.organizationName} !`,
    html: `
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
          .cta { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue !</h1>
          </div>
          <div class="content">
            <p>Cher(e) ${data.donorName},</p>
            <p>Merci de rejoindre notre communauté de donateurs !</p>
            <p>Grâce à des personnes généreuses comme vous, nous pouvons continuer notre mission et avoir un impact positif.</p>
            <p>Restez connecté(e) pour suivre l'impact de votre contribution et découvrir nos prochaines initiatives.</p>
            <p>Avec toute notre gratitude,<br>L'équipe ${data.organizationName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Bienvenue dans la communauté ${data.organizationName} !

Cher(e) ${data.donorName},

Merci de rejoindre notre communauté de donateurs !

Grâce à des personnes généreuses comme vous, nous pouvons continuer notre mission et avoir un impact positif.

Restez connecté(e) pour suivre l'impact de votre contribution et découvrir nos prochaines initiatives.

Avec toute notre gratitude,
L'équipe ${data.organizationName}
    `,
  }),

  // Campaign update
  campaignUpdate: (data: {
    donorName: string;
    campaignName: string;
    progress: number;
    goal: number;
    message: string;
  }) => ({
    subject: `Mise à jour : ${data.campaignName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .progress-container { background: #e5e7eb; border-radius: 10px; height: 20px; margin: 20px 0; overflow: hidden; }
          .progress-bar { background: linear-gradient(90deg, #8B5CF6, #EC4899); height: 100%; border-radius: 10px; }
          .stats { display: flex; justify-content: space-between; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.campaignName}</h1>
          </div>
          <div class="content">
            <p>Cher(e) ${data.donorName},</p>
            
            <div class="progress-container">
              <div class="progress-bar" style="width: ${Math.min((data.progress / data.goal) * 100, 100)}%"></div>
            </div>
            <div class="stats">
              <span><strong>${data.progress.toLocaleString("fr-CA")} $</strong> collectés</span>
              <span>Objectif : <strong>${data.goal.toLocaleString("fr-CA")} $</strong></span>
            </div>
            
            <p>${data.message}</p>
            
            <p>Merci pour votre soutien continu !</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${data.campaignName} - Mise à jour

Cher(e) ${data.donorName},

Progression : ${data.progress.toLocaleString("fr-CA")} $ / ${data.goal.toLocaleString("fr-CA")} $

${data.message}

Merci pour votre soutien continu !
    `,
  }),
};

// Send donation confirmation email
export async function sendDonationConfirmation(
  email: string,
  data: {
    donorName: string;
    amount: number;
    campaignName?: string;
    transactionId: string;
    date: Date;
  }
): Promise<boolean> {
  const template = EmailTemplates.donationConfirmation(data);
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    categories: ["donation", "confirmation"],
  });
}

// Send welcome email to new donor
export async function sendWelcomeEmail(
  email: string,
  donorName: string,
  organizationName: string = "Notre Organisation"
): Promise<boolean> {
  const template = EmailTemplates.welcomeDonor({ donorName, organizationName });
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    categories: ["welcome", "onboarding"],
  });
}

// Send campaign update
export async function sendCampaignUpdate(
  email: string,
  data: {
    donorName: string;
    campaignName: string;
    progress: number;
    goal: number;
    message: string;
  }
): Promise<boolean> {
  const template = EmailTemplates.campaignUpdate(data);
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    categories: ["campaign", "update"],
  });
}
