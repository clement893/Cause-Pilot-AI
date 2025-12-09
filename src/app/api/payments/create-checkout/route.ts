import { NextRequest, NextResponse } from "next/server";
import { createDonationCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      formId,
      donorEmail,
      donorFirstName,
      donorLastName,
      isRecurring,
      recurringFrequency,
      campaignId,
      comment,
      isAnonymous,
    } = body;

    // Validate required fields
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Le montant minimum est de 1$" },
        { status: 400 }
      );
    }

    if (!formId) {
      return NextResponse.json(
        { error: "L'identifiant du formulaire est requis" },
        { status: 400 }
      );
    }

    // Get form details
    const form = await prisma.donationForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Formulaire non trouvé" },
        { status: 404 }
      );
    }

    // Get campaign details if provided
    let campaign = null;
    if (campaignId) {
      campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });
    }

    // Map recurring frequency to Stripe interval
    const intervalMap: Record<string, "week" | "month" | "year"> = {
      WEEKLY: "week",
      BIWEEKLY: "week", // Will need to handle bi-weekly separately
      MONTHLY: "month",
      QUARTERLY: "month", // Will need to handle quarterly separately
      YEARLY: "year",
    };

    const donorName = `${donorFirstName || ""} ${donorLastName || ""}`.trim();

    // Create Stripe checkout session
    const session = await createDonationCheckoutSession({
      amount: Math.round(amount), // Amount should be in cents
      donorEmail,
      donorName: isAnonymous ? "Donateur anonyme" : donorName,
      formId,
      formName: form.name,
      campaignId: campaign?.id,
      campaignName: campaign?.name,
      isRecurring: isRecurring || false,
      recurringInterval: intervalMap[recurringFrequency] || "month",
      metadata: {
        donorFirstName: donorFirstName || "",
        donorLastName: donorLastName || "",
        comment: comment || "",
        isAnonymous: isAnonymous ? "true" : "false",
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    if (error instanceof Error && error.message.includes("Stripe is not configured")) {
      return NextResponse.json(
        { error: "Le système de paiement n'est pas configuré. Veuillez contacter l'administrateur." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
