import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-org";
import { getOrganizationId } from "@/lib/organization";

// GET - Récupérer les consentements d'un donateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    const prisma = await getPrisma(request);

    const donor = await prisma.donor.findFirst({
      where: { 
        id,
        organizationId, // S'assurer que le donateur appartient à l'organisation
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        consentEmail: true,
        consentPhone: true,
        consentMail: true,
        consentDate: true,
        optOutDate: true,
      },
    });

    if (!donor) {
      return NextResponse.json({ error: "Donateur non trouvé" }, { status: 404 });
    }

    // Récupérer l'historique des consentements
    const consentHistory = await prisma.consentHistory.findMany({
      where: { donorId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      donor,
      history: consentHistory,
    });
  } catch (error) {
    console.error("Error fetching consent:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des consentements" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les consentements d'un donateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { consentEmail, consentPhone, consentMail, source, reason } = body;

    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    const prisma = await getPrisma(request);
    
    // Récupérer les consentements actuels
    const currentDonor = await prisma.donor.findFirst({
      where: { 
        id,
        organizationId, // S'assurer que le donateur appartient à l'organisation
      },
      select: {
        consentEmail: true,
        consentPhone: true,
        consentMail: true,
      },
    });

    if (!currentDonor) {
      return NextResponse.json({ error: "Donateur non trouvé" }, { status: 404 });
    }

    // Préparer les changements
    const changes: string[] = [];
    const updateData: Record<string, boolean | Date | null> = {};

    if (consentEmail !== undefined && consentEmail !== currentDonor.consentEmail) {
      changes.push(`Email: ${currentDonor.consentEmail} → ${consentEmail}`);
      updateData.consentEmail = consentEmail;
    }

    if (consentPhone !== undefined && consentPhone !== currentDonor.consentPhone) {
      changes.push(`Téléphone: ${currentDonor.consentPhone} → ${consentPhone}`);
      updateData.consentPhone = consentPhone;
    }

    if (consentMail !== undefined && consentMail !== currentDonor.consentMail) {
      changes.push(`Courrier: ${currentDonor.consentMail} → ${consentMail}`);
      updateData.consentMail = consentMail;
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: "Aucun changement détecté" });
    }

    // Mettre à jour la date de consentement ou d'opt-out
    const hasAnyConsent = 
      (consentEmail ?? currentDonor.consentEmail) ||
      (consentPhone ?? currentDonor.consentPhone) ||
      (consentMail ?? currentDonor.consentMail);

    if (hasAnyConsent) {
      updateData.consentDate = new Date();
      updateData.optOutDate = null;
    } else {
      updateData.optOutDate = new Date();
    }

    // Transaction pour mettre à jour le donateur et créer l'historique
    const [updatedDonor] = await prisma.$transaction([
      prisma.donor.update({
        where: { id },
        data: updateData,
      }),
      prisma.consentHistory.create({
        data: {
          donorId: id,
          consentType: "update",
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
          source: source || "admin",
          reason: reason || null,
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Consentements mis à jour",
      changes,
      donor: updatedDonor,
    });
  } catch (error) {
    console.error("Error updating consent:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des consentements" },
      { status: 500 }
    );
  }
}
