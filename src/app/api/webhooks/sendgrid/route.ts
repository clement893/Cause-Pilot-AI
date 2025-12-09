import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Types d'événements SendGrid
type SendGridEventType = 
  | "processed"
  | "dropped"
  | "delivered"
  | "deferred"
  | "bounce"
  | "open"
  | "click"
  | "spamreport"
  | "unsubscribe"
  | "group_unsubscribe"
  | "group_resubscribe";

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: SendGridEventType;
  sg_event_id: string;
  sg_message_id: string;
  category?: string[];
  url?: string; // Pour les événements click
  ip?: string;
  useragent?: string;
  reason?: string; // Pour les bounces
  status?: string;
  type?: string; // Pour les bounces: "bounce" ou "blocked"
  campaign_id?: string; // Custom arg
}

// Vérifier la signature SendGrid (optionnel mais recommandé)
function verifySignature(
  payload: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    const timestampPayload = timestamp + payload;
    const decodedSignature = Buffer.from(signature, "base64");
    
    const verifier = crypto.createVerify("sha256");
    verifier.update(timestampPayload);
    
    return verifier.verify(publicKey, decodedSignature);
  } catch {
    return false;
  }
}

// POST - Recevoir les événements webhook de SendGrid
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const events: SendGridEvent[] = JSON.parse(body);

    // Optionnel: Vérifier la signature SendGrid
    // const signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature");
    // const timestamp = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp");
    // const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    // if (signature && timestamp && publicKey) {
    //   if (!verifySignature(body, signature, timestamp, publicKey)) {
    //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    //   }
    // }

    console.log(`[SendGrid Webhook] Received ${events.length} events`);

    // Traiter chaque événement
    for (const event of events) {
      await processEvent(event);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error("[SendGrid Webhook] Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function processEvent(event: SendGridEvent) {
  const { email, event: eventType, timestamp, campaign_id } = event;
  const eventDate = new Date(timestamp * 1000);

  console.log(`[SendGrid] Processing ${eventType} for ${email}`);

  try {
    // Trouver le destinataire par email et campaign_id si disponible
    let recipient;
    
    if (campaign_id) {
      recipient = await prisma.emailRecipient.findFirst({
        where: {
          email: email.toLowerCase(),
          campaignId: campaign_id,
        },
      });
    } else {
      // Chercher le destinataire le plus récent avec cet email
      recipient = await prisma.emailRecipient.findFirst({
        where: {
          email: email.toLowerCase(),
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    if (!recipient) {
      console.log(`[SendGrid] Recipient not found for ${email}`);
      return;
    }

    // Mettre à jour le destinataire selon le type d'événement
    switch (eventType) {
      case "delivered":
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "DELIVERED",
            deliveredAt: eventDate,
          },
        });
        // Mettre à jour les stats de la campagne
        await updateCampaignStats(recipient.campaignId, "delivered");
        break;

      case "open":
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "OPENED",
            openedAt: recipient.openedAt || eventDate, // Garder la première ouverture
            openCount: { increment: 1 },
          },
        });
        // Mettre à jour les stats de la campagne (seulement pour la première ouverture)
        if (!recipient.openedAt) {
          await updateCampaignStats(recipient.campaignId, "opened");
        }
        break;

      case "click":
        const clickedLinks = recipient.clickedLinks || [];
        if (event.url && !clickedLinks.includes(event.url)) {
          clickedLinks.push(event.url);
        }
        
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "CLICKED",
            clickedAt: recipient.clickedAt || eventDate, // Garder le premier clic
            clickCount: { increment: 1 },
            clickedLinks,
          },
        });
        // Mettre à jour les stats de la campagne (seulement pour le premier clic)
        if (!recipient.clickedAt) {
          await updateCampaignStats(recipient.campaignId, "clicked");
        }
        break;

      case "bounce":
        const bounceType = event.type === "blocked" ? "SOFT" : "HARD";
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "BOUNCED",
            bouncedAt: eventDate,
            bounceType,
            bounceReason: event.reason || event.status,
          },
        });
        await updateCampaignStats(recipient.campaignId, "bounced");
        break;

      case "dropped":
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "FAILED",
            bounceReason: event.reason || "Dropped by SendGrid",
          },
        });
        break;

      case "spamreport":
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "COMPLAINED",
            complainedAt: eventDate,
          },
        });
        await updateCampaignStats(recipient.campaignId, "complained");
        break;

      case "unsubscribe":
      case "group_unsubscribe":
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "UNSUBSCRIBED",
            unsubscribedAt: eventDate,
          },
        });
        await updateCampaignStats(recipient.campaignId, "unsubscribed");
        
        // Mettre à jour le consentement du donateur si lié
        if (recipient.donorId) {
          await prisma.donor.update({
            where: { id: recipient.donorId },
            data: {
              consentEmail: false,
              optOutDate: eventDate,
            },
          });
        }
        break;

      case "processed":
        await prisma.emailRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            sentAt: eventDate,
          },
        });
        break;

      default:
        console.log(`[SendGrid] Unhandled event type: ${eventType}`);
    }

    // Enregistrer l'événement dans la table EmailEvent
    await prisma.emailEvent.create({
      data: {
        recipientId: recipient.id,
        campaignId: recipient.campaignId,
        eventType,
        eventDate,
        email: email.toLowerCase(),
        url: event.url,
        ip: event.ip,
        userAgent: event.useragent,
        reason: event.reason,
        sgEventId: event.sg_event_id,
        sgMessageId: event.sg_message_id,
      },
    });

  } catch (error) {
    console.error(`[SendGrid] Error processing event for ${email}:`, error);
  }
}

async function updateCampaignStats(campaignId: string, eventType: string) {
  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return;

    const updateData: Record<string, unknown> = {};

    switch (eventType) {
      case "delivered":
        updateData.deliveredCount = { increment: 1 };
        break;
      case "opened":
        updateData.openCount = { increment: 1 };
        break;
      case "clicked":
        updateData.clickCount = { increment: 1 };
        break;
      case "bounced":
        updateData.bounceCount = { increment: 1 };
        break;
      case "complained":
        updateData.complaintCount = { increment: 1 };
        break;
      case "unsubscribed":
        updateData.unsubscribeCount = { increment: 1 };
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: updateData,
      });
    }
  } catch (error) {
    console.error(`[SendGrid] Error updating campaign stats:`, error);
  }
}

// GET - Vérifier que le webhook est accessible
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SendGrid webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
