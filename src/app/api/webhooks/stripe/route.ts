import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, getCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription created:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const {
    id: sessionId,
    customer_email,
    amount_total,
    metadata,
    mode,
    subscription,
    payment_intent,
  } = session;

  const formId = metadata?.formId;
  const campaignId = metadata?.campaignId;
  const donorFirstName = metadata?.donorFirstName || "";
  const donorLastName = metadata?.donorLastName || "";
  const comment = metadata?.comment || "";
  const isAnonymous = metadata?.isAnonymous === "true";

  if (!formId) {
    console.error("No formId in session metadata");
    return;
  }

  // Find or create donor
  let donor = null;
  if (customer_email && !isAnonymous) {
    donor = await prisma.donor.findUnique({
      where: { email: customer_email },
    });

    if (!donor) {
      donor = await prisma.donor.create({
        data: {
          firstName: donorFirstName || "Inconnu",
          lastName: donorLastName || "",
          email: customer_email,
          source: "Formulaire de don en ligne",
          consentEmail: true,
          consentDate: new Date(),
        },
      });
    }
  }

  // Create donation record
  const amountInDollars = (amount_total || 0) / 100;

  const donation = await prisma.donation.create({
    data: {
      donorId: donor?.id || "",
      amount: amountInDollars,
      currency: "CAD",
      donationDate: new Date(),
      paymentMethod: "CREDIT_CARD",
      status: "COMPLETED",
      transactionId: typeof payment_intent === "string" ? payment_intent : payment_intent?.id || sessionId,
      isRecurring: mode === "subscription",
      recurringId: typeof subscription === "string" ? subscription : subscription?.id,
      campaignId: campaignId || undefined,
      notes: comment,
      isAnonymous,
    },
  });

  // Update donor statistics
  if (donor) {
    const donorDonations = await prisma.donation.findMany({
      where: { donorId: donor.id, status: "COMPLETED" },
    });

    const totalDonations = donorDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = donorDonations.length;
    const averageDonation = donationCount > 0 ? totalDonations / donationCount : 0;
    const highestDonation = Math.max(...donorDonations.map((d) => d.amount));

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        totalDonations,
        donationCount,
        averageDonation,
        highestDonation,
        lastDonationDate: new Date(),
        firstDonationDate: donor.firstDonationDate || new Date(),
      },
    });
  }

  // Update form statistics
  await prisma.donationForm.update({
    where: { id: formId },
    data: {
      totalCollected: { increment: amountInDollars },
      donationCount: { increment: 1 },
    },
  });

  // Update campaign statistics if applicable
  if (campaignId) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalRaised: { increment: amountInDollars },
        donorCount: { increment: 1 },
        donationCount: { increment: 1 },
      },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      module: "donations",
      entityType: "Donation",
      entityId: donation.id,
      description: `Nouveau don de ${amountInDollars}$ via Stripe`,
      metadata: JSON.stringify({
        sessionId,
        donorEmail: customer_email,
        formId,
        campaignId,
      }),
    },
  });

  console.log(`Donation recorded: ${donation.id} - ${amountInDollars}$`);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  // Find donations with this subscription ID and mark as cancelled
  await prisma.donation.updateMany({
    where: { recurringId: subscription.id },
    data: {
      isRecurring: false,
      notes: "Abonnement annulé",
    },
  });

  console.log(`Subscription cancelled: ${subscription.id}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Handle recurring payment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any;
  if (invoiceAny.subscription && invoice.billing_reason === "subscription_cycle") {
    const subscriptionId = typeof invoiceAny.subscription === "string" 
      ? invoiceAny.subscription 
      : invoiceAny.subscription.id;

    // Find the original donation to get form/campaign info
    const originalDonation = await prisma.donation.findFirst({
      where: { recurringId: subscriptionId },
      orderBy: { createdAt: "asc" },
    });

    if (originalDonation) {
      const amountInDollars = (invoice.amount_paid || 0) / 100;

      // Create new donation record for recurring payment
      await prisma.donation.create({
        data: {
          donorId: originalDonation.donorId || "",
          amount: amountInDollars,
          currency: "CAD",
          donationDate: new Date(),
          paymentMethod: "CREDIT_CARD",
          status: "COMPLETED",
          transactionId: invoice.payment_intent as string,
          isRecurring: true,
          recurringId: subscriptionId,
          campaignId: originalDonation.campaignId,
          isAnonymous: originalDonation.isAnonymous,
        },
      });

      // Update statistics
      if (originalDonation.donorId) {
        await prisma.donor.update({
          where: { id: originalDonation.donorId },
          data: {
            totalDonations: { increment: amountInDollars },
            donationCount: { increment: 1 },
            lastDonationDate: new Date(),
          },
        });
      }

      console.log(`Recurring payment recorded: ${amountInDollars}$`);
    }
  }
}
