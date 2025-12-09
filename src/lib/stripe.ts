import Stripe from "stripe";

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe payments will not work.");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    })
  : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: "cad",
  paymentMethods: ["card"],
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/donate/cancel`,
};

// Create a checkout session for one-time donation
export async function createDonationCheckoutSession({
  amount,
  donorEmail,
  donorName,
  formId,
  formName,
  campaignId,
  campaignName,
  isRecurring = false,
  recurringInterval = "month",
  metadata = {},
}: {
  amount: number; // Amount in cents
  donorEmail?: string;
  donorName?: string;
  formId: string;
  formName: string;
  campaignId?: string;
  campaignName?: string;
  isRecurring?: boolean;
  recurringInterval?: "month" | "year" | "week";
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    mode: isRecurring ? "subscription" : "payment",
    customer_email: donorEmail,
    success_url: `${STRIPE_CONFIG.successUrl}&form_id=${formId}`,
    cancel_url: `${STRIPE_CONFIG.cancelUrl}?form_id=${formId}`,
    metadata: {
      formId,
      formName,
      campaignId: campaignId || "",
      campaignName: campaignName || "",
      donorName: donorName || "",
      ...metadata,
    },
    line_items: [
      {
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: `Don - ${formName}`,
            description: campaignName
              ? `Contribution à la campagne "${campaignName}"`
              : `Don via le formulaire "${formName}"`,
          },
          unit_amount: amount,
          ...(isRecurring && {
            recurring: {
              interval: recurringInterval,
            },
          }),
        },
        quantity: 1,
      },
    ],
    billing_address_collection: "required",
  };

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

// Create a payment intent for custom payment flow
export async function createPaymentIntent({
  amount,
  donorEmail,
  metadata = {},
}: {
  amount: number;
  donorEmail?: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: STRIPE_CONFIG.currency,
    payment_method_types: ["card"],
    receipt_email: donorEmail,
    metadata,
  });

  return paymentIntent;
}

// Retrieve a checkout session
export async function getCheckoutSession(sessionId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "subscription", "customer"],
  });

  return session;
}

// Create a customer
export async function createCustomer({
  email,
  name,
  metadata = {},
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  });

  return customer;
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

// Construct webhook event
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
