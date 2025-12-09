import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Fusionner deux donateurs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keepDonorId, mergeDonorId, fieldsToKeep } = body as {
      keepDonorId: string;
      mergeDonorId: string;
      fieldsToKeep?: Record<string, "keep" | "merge">;
    };

    if (!keepDonorId || !mergeDonorId) {
      return NextResponse.json(
        { error: "Les IDs des deux donateurs sont requis" },
        { status: 400 }
      );
    }

    if (keepDonorId === mergeDonorId) {
      return NextResponse.json(
        { error: "Impossible de fusionner un donateur avec lui-même" },
        { status: 400 }
      );
    }

    // Récupérer les deux donateurs
    const [keepDonor, mergeDonor] = await Promise.all([
      prisma.donor.findUnique({ where: { id: keepDonorId } }),
      prisma.donor.findUnique({ where: { id: mergeDonorId } }),
    ]);

    if (!keepDonor || !mergeDonor) {
      return NextResponse.json(
        { error: "Un ou plusieurs donateurs non trouvés" },
        { status: 404 }
      );
    }

    // Préparer les données fusionnées
    const mergedData: Record<string, unknown> = {};
    
    // Liste des champs à potentiellement fusionner
    const mergeableFields = [
      "firstName", "lastName", "email", "phone", "mobile",
      "address", "city", "province", "postalCode", "country",
      "dateOfBirth", "profession", "employer", "jobTitle", "industry",
      "notes", "source", "segment", "tags",
      "emailConsent", "phoneConsent", "mailConsent",
    ];

    for (const field of mergeableFields) {
      const keepValue = (keepDonor as Record<string, unknown>)[field];
      const mergeValue = (mergeDonor as Record<string, unknown>)[field];
      
      // Si fieldsToKeep spécifie de prendre la valeur du donateur à fusionner
      if (fieldsToKeep?.[field] === "merge" && mergeValue !== null && mergeValue !== undefined) {
        mergedData[field] = mergeValue;
      }
      // Sinon, garder la valeur du donateur principal, ou prendre celle du doublon si vide
      else if (keepValue === null || keepValue === undefined || keepValue === "") {
        if (mergeValue !== null && mergeValue !== undefined && mergeValue !== "") {
          mergedData[field] = mergeValue;
        }
      }
    }

    // Fusionner les tags (union)
    const keepTags = (keepDonor.tags as string[]) || [];
    const mergeTags = (mergeDonor.tags as string[]) || [];
    const allTags = [...new Set([...keepTags, ...mergeTags])];
    mergedData.tags = allTags;

    // Fusionner les notes (concaténer)
    if (mergeDonor.notes && keepDonor.notes !== mergeDonor.notes) {
      const separator = keepDonor.notes ? "\n\n---\n[Fusionné le " + new Date().toLocaleDateString("fr-CA") + "]\n" : "";
      mergedData.notes = (keepDonor.notes || "") + separator + (mergeDonor.notes || "");
    }

    // Transaction pour la fusion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le donateur principal avec les données fusionnées
      const updatedDonor = await tx.donor.update({
        where: { id: keepDonorId },
        data: mergedData,
      });

      // 2. Transférer tous les dons du doublon vers le donateur principal
      const donationsTransferred = await tx.donation.updateMany({
        where: { donorId: mergeDonorId },
        data: { donorId: keepDonorId },
      });

      // 3. Transférer les activités (si le modèle existe)
      let activitiesTransferred = { count: 0 };
      try {
        activitiesTransferred = await tx.donorActivity.updateMany({
          where: { donorId: mergeDonorId },
          data: { donorId: keepDonorId },
        });
      } catch {
        // Le modèle DonorActivity n'existe peut-être pas
      }

      // 4. Transférer les préférences (si le modèle existe)
      try {
        await tx.donorPreferences.updateMany({
          where: { donorId: mergeDonorId },
          data: { donorId: keepDonorId },
        });
      } catch {
        // Le modèle DonorPreferences n'existe peut-être pas
      }

      // 5. Transférer les consentements
      try {
        await tx.consent.updateMany({
          where: { donorId: mergeDonorId },
          data: { donorId: keepDonorId },
        });
      } catch {
        // Le modèle Consent n'existe peut-être pas
      }

      // 6. Transférer les campagnes P2P
      try {
        await tx.p2PFundraiser.updateMany({
          where: { donorId: mergeDonorId },
          data: { donorId: keepDonorId },
        });
      } catch {
        // Le modèle P2PFundraiser n'existe peut-être pas
      }

      // 7. Transférer les destinataires email
      try {
        await tx.emailRecipient.updateMany({
          where: { donorId: mergeDonorId },
          data: { donorId: keepDonorId },
        });
      } catch {
        // Le modèle EmailRecipient n'existe peut-être pas
      }

      // 8. Supprimer le doublon
      await tx.donor.delete({
        where: { id: mergeDonorId },
      });

      return {
        updatedDonor,
        donationsTransferred: donationsTransferred.count,
        activitiesTransferred: activitiesTransferred.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Donateurs fusionnés avec succès",
      mergedDonor: result.updatedDonor,
      stats: {
        donationsTransferred: result.donationsTransferred,
        activitiesTransferred: result.activitiesTransferred,
      },
    });
  } catch (error) {
    console.error("Error merging donors:", error);
    return NextResponse.json(
      { error: "Erreur lors de la fusion des donateurs" },
      { status: 500 }
    );
  }
}
