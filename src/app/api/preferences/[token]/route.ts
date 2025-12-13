import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Get JWT secret with strict validation
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

// Fonction pour générer un token unique basé sur l'email du donateur
function generateToken(donorId: string, email: string): string {
  const secret = getJWTSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${donorId}:${email}`)
    .digest("hex")
    .substring(0, 32);
}

// Fonction pour vérifier le token
async function verifyToken(token: string): Promise<string | null> {
  // Chercher le donateur correspondant au token
  const donors = await prisma.donor.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true },
  });

  for (const donor of donors) {
    if (donor.email && generateToken(donor.id, donor.email) === token) {
      return donor.id;
    }
  }
  return null;
}

// GET - Récupérer les préférences d'un donateur via token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const donorId = await verifyToken(token);
    if (!donorId) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré" },
        { status: 404 }
      );
    }

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        consentEmail: true,
        consentPhone: true,
        consentMail: true,
        consentDate: true,
        DonorPreference: {
          select: {
            preferredChannel: true,
            preferredFrequency: true,
            preferredLanguage: true,
            causesOfInterest: true,
          },
        },
      },
    });

    if (!donor) {
      return NextResponse.json(
        { error: "Donateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      donor: {
        firstName: donor.firstName,
        email: donor.email,
        consentEmail: donor.consentEmail,
        consentPhone: donor.consentPhone,
        consentMail: donor.consentMail,
        consentDate: donor.consentDate,
        preferences: donor.DonorPreference,
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les préférences via le centre de préférences public
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const donorId = await verifyToken(token);
    if (!donorId) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré" },
        { status: 404 }
      );
    }

    const { consentEmail, consentPhone, consentMail, preferences } = body;

    // Récupérer les consentements actuels
    const currentDonor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        consentEmail: true,
        consentPhone: true,
        consentMail: true,
      },
    });

    if (!currentDonor) {
      return NextResponse.json(
        { error: "Donateur non trouvé" },
        { status: 404 }
      );
    }

    // Préparer les mises à jour
    const donorUpdate: Record<string, boolean | Date | null> = {};
    
    if (consentEmail !== undefined) donorUpdate.consentEmail = consentEmail;
    if (consentPhone !== undefined) donorUpdate.consentPhone = consentPhone;
    if (consentMail !== undefined) donorUpdate.consentMail = consentMail;

    // Mettre à jour la date de consentement
    const hasAnyConsent = 
      (consentEmail ?? currentDonor.consentEmail) ||
      (consentPhone ?? currentDonor.consentPhone) ||
      (consentMail ?? currentDonor.consentMail);

    if (hasAnyConsent) {
      donorUpdate.consentDate = new Date();
      donorUpdate.optOutDate = null;
    } else {
      donorUpdate.optOutDate = new Date();
    }

    // Transaction pour mettre à jour le donateur et créer l'historique
    await prisma.$transaction([
      prisma.donor.update({
        where: { id: donorId },
        data: donorUpdate,
      }),
      prisma.consentHistory.create({
        data: {
          donorId,
          consentType: hasAnyConsent ? "update" : "opt_out",
          previousValue: JSON.stringify({
            consentEmail: currentDonor.consentEmail,
            consentPhone: currentDonor.consentPhone,
            consentMail: currentDonor.consentMail,
          }),
          newValue: JSON.stringify({
            consentEmail: consentEmail ?? currentDonor.consentEmail,
            consentPhone: consentPhone ?? currentDonor.consentPhone,
            consentMail: consentMail ?? currentDonor.consentMail,
          }),
          source: "preference_center",
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
          userAgent: request.headers.get("user-agent") || null,
        },
      }),
    ]);

    // Mettre à jour les préférences si fournies
    if (preferences) {
      await prisma.donorPreference.upsert({
        where: { donorId },
        update: {
          preferredChannel: preferences.preferredChannel,
          preferredFrequency: preferences.preferredFrequency,
          preferredLanguage: preferences.preferredLanguage,
          causesOfInterest: preferences.causesOfInterest || [],
        },
        create: {
          donorId,
          preferredChannel: preferences.preferredChannel || "EMAIL",
          preferredFrequency: preferences.preferredFrequency || "MONTHLY",
          preferredLanguage: preferences.preferredLanguage || "fr",
          causesOfInterest: preferences.causesOfInterest || [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Préférences mises à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des préférences" },
      { status: 500 }
    );
  }
}
