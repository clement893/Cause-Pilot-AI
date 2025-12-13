import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getMainPrisma } from "@/lib/prisma-org";
import { getPrismaForOrganization } from "@/lib/prisma-multi";
import { prisma } from "@/lib/prisma";

// POST - Soumettre un don
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Valider les champs requis
    if (!body.formId) {
      return NextResponse.json(
        { error: "L'ID du formulaire est requis" },
        { status: 400 }
      );
    }
    
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }
    
    if (!body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: "Email, prénom et nom sont requis" },
        { status: 400 }
      );
    }

    // Récupérer le formulaire depuis la base principale pour obtenir l'organisation
    // Les formulaires ont un campaignId qui pointe vers une campagne avec organizationId
    const mainPrisma = getMainPrisma();
    const form = await mainPrisma.donationForm.findUnique({
      where: { id: body.formId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        minimumAmount: true,
        maximumAmount: true,
        campaignId: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Formulaire non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer l'organizationId depuis le body ou utiliser la base par défaut
    // Les campagnes n'ont pas de organizationId dans le schéma actuel
    // Pour une route publique, on peut accepter organizationId dans le body
    // ou utiliser la base par défaut si le système multi-database n'est pas activé
    const organizationId: string | null = body.organizationId || null;
    let prismaInstance: typeof prisma;
    
    const useMultiDatabase = process.env.ENABLE_MULTI_DATABASE === "true";
    
    if (useMultiDatabase && organizationId) {
      // Utiliser la base dédiée de l'organisation si fournie et si le système multi-database est activé
      prismaInstance = await getPrismaForOrganization(organizationId);
    } else {
      // Utiliser la base par défaut (mode partagé ou si pas d'organizationId fourni)
      prismaInstance = prisma;
    }

    if (form.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Ce formulaire n'est pas disponible" },
        { status: 400 }
      );
    }

    // Vérifier les dates de validité
    const now = new Date();
    if (form.startDate && now < form.startDate) {
      return NextResponse.json(
        { error: "Ce formulaire n'est pas encore actif" },
        { status: 400 }
      );
    }
    if (form.endDate && now > form.endDate) {
      return NextResponse.json(
        { error: "Ce formulaire a expiré" },
        { status: 400 }
      );
    }

    // Vérifier le montant minimum/maximum
    if (body.amount < form.minimumAmount) {
      return NextResponse.json(
        { error: `Le montant minimum est de ${form.minimumAmount} $` },
        { status: 400 }
      );
    }
    if (form.maximumAmount && body.amount > form.maximumAmount) {
      return NextResponse.json(
        { error: `Le montant maximum est de ${form.maximumAmount} $` },
        { status: 400 }
      );
    }

    // Chercher ou créer le donateur
    const donorWhere: Prisma.DonorWhereInput = { email: body.email };
    if (organizationId) {
      donorWhere.organizationId = organizationId;
    }
    
    let donor = await prismaInstance.donor.findFirst({
      where: donorWhere,
    });

    if (!donor) {
      const donorData: Prisma.DonorCreateInput = {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || "Canada",
        employer: body.employer,
        source: `Formulaire: ${form.name}`,
        consentEmail: body.consentEmail || false,
        status: "ACTIVE",
      };
      
      if (organizationId) {
        donorData.organizationId = organizationId;
      }
      
      donor = await prismaInstance.donor.create({
        data: donorData,
      });
    }

    // Générer un ID de transaction unique
    const transactionId = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Créer la soumission (dans la base dédiée de l'organisation)
    const submission = await prismaInstance.donationSubmission.create({
      data: {
        formId: body.formId,
        donorId: donor.id,
        amount: body.amount,
        currency: body.currency || "CAD",
        paymentMethod: body.paymentMethod,
        paymentStatus: "PENDING", // Sera mis à jour après le paiement
        transactionId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country || "Canada",
        employer: body.employer,
        isRecurring: body.isRecurring || false,
        recurringFrequency: body.recurringFrequency,
        dedicationType: body.dedicationType,
        dedicateeName: body.dedicateeName,
        dedicateeEmail: body.dedicateeEmail,
        dedicateeMessage: body.dedicateeMessage,
        notifyDedicatee: body.notifyDedicatee || false,
        isAnonymous: body.isAnonymous || false,
        comment: body.comment,
        consentEmail: body.consentEmail || false,
        consentNewsletter: body.consentNewsletter || false,
        customFields: body.customFields ? JSON.stringify(body.customFields) : null,
        source: body.source,
        medium: body.medium,
        campaign: body.campaign,
        referrer: body.referrer,
      },
    });

    // Simuler le paiement réussi (à remplacer par Stripe en production)
    // Pour l'instant, on marque directement comme complété
    const completedSubmission = await prismaInstance.donationSubmission.update({
      where: { id: submission.id },
      data: {
        paymentStatus: "COMPLETED",
        receiptNumber: `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`,
      },
    });

    // Mettre à jour les statistiques du formulaire (dans la base principale)
    await mainPrisma.donationForm.update({
      where: { id: body.formId },
      data: {
        totalCollected: { increment: body.amount },
        donationCount: { increment: 1 },
        averageDonation: form.donationCount > 0 
          ? (form.totalCollected + body.amount) / (form.donationCount + 1)
          : body.amount,
      },
    });

    // Mettre à jour les statistiques du donateur (dans la base dédiée)
    await prismaInstance.donor.update({
      where: { id: donor.id },
      data: {
        totalDonations: { increment: body.amount },
        donationCount: { increment: 1 },
        lastDonationDate: new Date(),
        firstDonationDate: donor.firstDonationDate || new Date(),
        averageDonation: donor.donationCount > 0
          ? (donor.totalDonations + body.amount) / (donor.donationCount + 1)
          : body.amount,
        highestDonation: body.amount > donor.highestDonation ? body.amount : donor.highestDonation,
      },
    });

    // Créer l'entrée dans l'historique des dons (dans la base dédiée)
    await prismaInstance.donation.create({
      data: {
        donorId: donor.id,
        amount: body.amount,
        currency: body.currency || "CAD",
        donationDate: new Date(),
        paymentMethod: body.paymentMethod || "CREDIT_CARD",
        status: "COMPLETED",
        transactionId,
        receiptNumber: completedSubmission.receiptNumber,
        campaignId: form.campaignId,
        campaignName: form.campaignName || form.name,
        donationType: body.isRecurring ? "MONTHLY" : "ONE_TIME",
        isRecurring: body.isRecurring || false,
        dedicationType: body.dedicationType,
        dedicateeName: body.dedicateeName,
        dedicateeEmail: body.dedicateeEmail,
        notifyDedicatee: body.notifyDedicatee || false,
        notes: body.comment,
        isAnonymous: body.isAnonymous || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Don enregistré avec succès!",
      data: {
        transactionId,
        receiptNumber: completedSubmission.receiptNumber,
        amount: body.amount,
        thankYouMessage: form.thankYouMessage,
        redirectUrl: form.thankYouRedirectUrl,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Error processing donation:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du don", details: String(error) },
      { status: 500 }
    );
  }
}

// GET - Récupérer les soumissions d'un formulaire
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (formId) {
      where.formId = formId;
    }

    const [submissions, total] = await Promise.all([
      prisma.donationSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          DonationForm: {
            select: { name: true, slug: true },
          },
          Donor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.donationSubmission.count({ where }),
    ]);

    return NextResponse.json({
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des soumissions" },
      { status: 500 }
    );
  }
}
