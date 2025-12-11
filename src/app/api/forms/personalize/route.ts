import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface PersonalizedFormData {
  isRecognized: boolean;
  donor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  suggestedAmounts: number[];
  recommendedAmount: number | null;
  lastDonation: {
    amount: number;
    date: string;
    campaignName?: string;
  } | null;
  donorStats: {
    totalDonations: number;
    donationCount: number;
    averageDonation: number;
    isRecurring: boolean;
  } | null;
  welcomeMessage: string | null;
}

// POST - Personnaliser le formulaire pour un donateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, formId, donorToken } = body;

    // Récupérer le formulaire
    const form = await prisma.donationForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Formulaire non trouvé" },
        { status: 404 }
      );
    }

    // Essayer de trouver le donateur par email ou token
    let donor = null;

    if (email) {
      donor = await prisma.donor.findUnique({
        where: { email },
        include: {
          donations: {
            orderBy: { donationDate: "desc" },
            take: 10,
          },
        },
      });
    }

    // Si pas trouvé par email, essayer par token (cookie)
    if (!donor && donorToken) {
      // Le token pourrait être l'ID du donateur encodé
      try {
        const donorId = Buffer.from(donorToken, "base64").toString("utf-8");
        donor = await prisma.donor.findUnique({
          where: { id: donorId },
          include: {
            donations: {
              orderBy: { donationDate: "desc" },
              take: 10,
            },
          },
        });
      } catch {
        // Token invalide, ignorer
      }
    }

    // Si donateur non trouvé, retourner les montants par défaut
    if (!donor) {
      const response: PersonalizedFormData = {
        isRecognized: false,
        donor: null,
        suggestedAmounts: form.suggestedAmounts,
        recommendedAmount: form.defaultAmount,
        lastDonation: null,
        donorStats: null,
        welcomeMessage: null,
      };
      return NextResponse.json(response);
    }

    // Calculer les montants personnalisés
    const lastDonation = donor.donations[0];
    const completedDonations = donor.donations.filter(
      (d) => d.status === "COMPLETED"
    );

    // Calculer le montant recommandé (dernier don + 15%)
    let recommendedAmount: number | null = null;
    if (lastDonation) {
      // Augmenter de 10-20% (moyenne 15%)
      const increase = 1 + (0.1 + Math.random() * 0.1); // Entre 10% et 20%
      recommendedAmount = Math.round(lastDonation.amount * increase);

      // Arrondir à un montant "propre"
      if (recommendedAmount < 50) {
        recommendedAmount = Math.ceil(recommendedAmount / 5) * 5; // Arrondir à 5
      } else if (recommendedAmount < 100) {
        recommendedAmount = Math.ceil(recommendedAmount / 10) * 10; // Arrondir à 10
      } else if (recommendedAmount < 500) {
        recommendedAmount = Math.ceil(recommendedAmount / 25) * 25; // Arrondir à 25
      } else {
        recommendedAmount = Math.ceil(recommendedAmount / 50) * 50; // Arrondir à 50
      }
    }

    // Générer des montants suggérés personnalisés
    const suggestedAmounts = generatePersonalizedAmounts(
      donor.averageDonation,
      lastDonation?.amount || 0,
      form.suggestedAmounts
    );

    // Vérifier si le donateur a des dons récurrents
    const hasRecurringDonations = donor.donations.some((d) => d.isRecurring);

    // Créer le message de bienvenue
    const welcomeMessage = `Bonjour ${donor.firstName} ! Merci pour votre fidélité.`;

    const response: PersonalizedFormData = {
      isRecognized: true,
      donor: {
        id: donor.id,
        firstName: donor.firstName,
        lastName: donor.lastName,
        email: donor.email || "",
        phone: donor.phone || undefined,
        address: donor.address || undefined,
        city: donor.city || undefined,
        state: donor.state || undefined,
        postalCode: donor.postalCode || undefined,
        country: donor.country || undefined,
      },
      suggestedAmounts,
      recommendedAmount,
      lastDonation: lastDonation
        ? {
            amount: lastDonation.amount,
            date: lastDonation.donationDate.toISOString(),
            campaignName: lastDonation.campaignName || undefined,
          }
        : null,
      donorStats: {
        totalDonations: donor.totalDonations,
        donationCount: donor.donationCount,
        averageDonation: donor.averageDonation,
        isRecurring: hasRecurringDonations,
      },
      welcomeMessage,
    };

    // Générer un token pour le cookie (pour les prochaines visites)
    const donorTokenResponse = Buffer.from(donor.id).toString("base64");

    return NextResponse.json({
      ...response,
      donorToken: donorTokenResponse,
    });
  } catch (error) {
    console.error("Personalize form error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la personnalisation" },
      { status: 500 }
    );
  }
}

/**
 * Génère des montants suggérés personnalisés basés sur l'historique du donateur
 */
function generatePersonalizedAmounts(
  averageDonation: number,
  lastDonation: number,
  defaultAmounts: number[]
): number[] {
  // Si pas d'historique, utiliser les montants par défaut
  if (!averageDonation && !lastDonation) {
    return defaultAmounts;
  }

  const baseAmount = lastDonation || averageDonation;

  // Générer 5 montants autour du montant de base
  const amounts: number[] = [];

  // Montant inférieur (80% du dernier don)
  amounts.push(roundToNiceAmount(baseAmount * 0.8));

  // Montant égal au dernier don
  amounts.push(roundToNiceAmount(baseAmount));

  // Montant légèrement supérieur (+15%)
  amounts.push(roundToNiceAmount(baseAmount * 1.15));

  // Montant supérieur (+30%)
  amounts.push(roundToNiceAmount(baseAmount * 1.3));

  // Montant ambitieux (+50%)
  amounts.push(roundToNiceAmount(baseAmount * 1.5));

  // Supprimer les doublons et trier
  const uniqueAmounts = [...new Set(amounts)].sort((a, b) => a - b);

  // S'assurer qu'on a au moins 3 montants
  if (uniqueAmounts.length < 3) {
    return defaultAmounts;
  }

  return uniqueAmounts.slice(0, 5);
}

/**
 * Arrondit un montant à une valeur "propre"
 */
function roundToNiceAmount(amount: number): number {
  if (amount < 25) {
    return Math.round(amount / 5) * 5 || 5;
  } else if (amount < 100) {
    return Math.round(amount / 10) * 10;
  } else if (amount < 250) {
    return Math.round(amount / 25) * 25;
  } else if (amount < 1000) {
    return Math.round(amount / 50) * 50;
  } else {
    return Math.round(amount / 100) * 100;
  }
}
