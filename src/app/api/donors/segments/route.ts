import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les segments de donateurs avec compteurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCount = searchParams.get("includeCount") === "true";

    // Récupérer les segments uniques
    const donors = await prisma.donor.findMany({
      where: {
        consentEmail: true,
        email: { not: null },
        status: { not: "DO_NOT_CONTACT" },
      },
      select: {
        segment: true,
        status: true,
        donorType: true,
        tags: true,
      },
    });

    // Calculer les segments
    const segmentCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    donors.forEach((donor) => {
      // Segments
      if (donor.segment) {
        segmentCounts[donor.segment] = (segmentCounts[donor.segment] || 0) + 1;
      }

      // Status
      if (donor.status) {
        statusCounts[donor.status] = (statusCounts[donor.status] || 0) + 1;
      }

      // Type
      if (donor.donorType) {
        typeCounts[donor.donorType] = (typeCounts[donor.donorType] || 0) + 1;
      }

      // Tags
      if (donor.tags && Array.isArray(donor.tags)) {
        donor.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Formater les résultats
    const segments = Object.entries(segmentCounts).map(([name, count]) => ({
      id: `segment:${name}`,
      type: "segment",
      name,
      count,
    }));

    const statuses = Object.entries(statusCounts).map(([name, count]) => ({
      id: `status:${name}`,
      type: "status",
      name: getStatusLabel(name),
      value: name,
      count,
    }));

    const types = Object.entries(typeCounts).map(([name, count]) => ({
      id: `type:${name}`,
      type: "donorType",
      name: getTypeLabel(name),
      value: name,
      count,
    }));

    const tags = Object.entries(tagCounts).map(([name, count]) => ({
      id: `tag:${name}`,
      type: "tag",
      name,
      count,
    }));

    // Segments prédéfinis
    const predefinedSegments = [
      {
        id: "all",
        type: "predefined",
        name: "Tous les donateurs",
        description: "Tous les donateurs avec consentement email",
        count: donors.length,
      },
      {
        id: "active",
        type: "predefined",
        name: "Donateurs actifs",
        description: "Donateurs avec statut actif",
        count: statusCounts["ACTIVE"] || 0,
      },
      {
        id: "recurring",
        type: "predefined",
        name: "Donateurs récurrents",
        description: "Donateurs avec dons récurrents",
        count: await prisma.donor.count({
          where: {
            consentEmail: true,
            email: { not: null },
            donations: {
              some: {
                isRecurring: true,
              },
            },
          },
        }),
      },
      {
        id: "new",
        type: "predefined",
        name: "Nouveaux donateurs",
        description: "Donateurs créés ce mois-ci",
        count: await prisma.donor.count({
          where: {
            consentEmail: true,
            email: { not: null },
            createdAt: {
              gte: new Date(new Date().setDate(1)), // Premier jour du mois
            },
          },
        }),
      },
      {
        id: "lapsed",
        type: "predefined",
        name: "Donateurs lapsés",
        description: "Donateurs inactifs depuis plus de 12 mois",
        count: statusCounts["LAPSED"] || 0,
      },
    ];

    return NextResponse.json({
      totalEligible: donors.length,
      predefinedSegments,
      segments,
      statuses,
      types,
      tags,
    });
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des segments" },
      { status: 500 }
    );
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Actif",
    INACTIVE: "Inactif",
    LAPSED: "Lapsé",
    PENDING: "En attente",
    DECEASED: "Décédé",
    DO_NOT_CONTACT: "Ne pas contacter",
  };
  return labels[status] || status;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INDIVIDUAL: "Individuel",
    CORPORATE: "Entreprise",
    FOUNDATION: "Fondation",
    GOVERNMENT: "Gouvernement",
    ANONYMOUS: "Anonyme",
  };
  return labels[type] || type;
}
