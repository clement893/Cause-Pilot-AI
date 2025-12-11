import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types pour les segments intelligents
interface SmartSegment {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  donorCount: number;
  totalValue: number;
  avgDonation: number;
  donors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    totalDonations: number;
    donationCount: number;
    lastDonationDate: Date | null;
    potentialScore: number | null;
    churnRiskScore: number | null;
  }>;
}

// GET /api/segments/smart - Récupérer tous les segments intelligents
export async function GET() {
  try {
    // Récupérer tous les donateurs avec leurs scores
    const allDonors = await prisma.donor.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        donorType: true,
        totalDonations: true,
        donationCount: true,
        averageDonation: true,
        highestDonation: true,
        lastDonationDate: true,
        firstDonationDate: true,
        potentialScore: true,
        churnRiskScore: true,
        segment: true,
        tags: true,
      },
    });

    // Calculer les segments intelligents
    const smartSegments: SmartSegment[] = [];

    // 1. Segment "À risque de churn"
    const churnRiskDonors = allDonors.filter(d => {
      // Donateurs avec score de churn élevé ou inactifs depuis longtemps
      if (d.churnRiskScore && d.churnRiskScore >= 60) return true;
      if (d.lastDonationDate) {
        const daysSinceLastDonation = Math.floor(
          (Date.now() - new Date(d.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastDonation > 180 && d.donationCount > 1;
      }
      return false;
    });

    smartSegments.push({
      id: "churn-risk",
      name: "À risque de churn",
      description: "Donateurs qui risquent de ne plus donner - nécessitent une attention particulière",
      icon: "AlertTriangle",
      color: "red",
      criteria: "Score de churn ≥ 60 OU inactif depuis plus de 6 mois avec historique de dons",
      donorCount: churnRiskDonors.length,
      totalValue: churnRiskDonors.reduce((sum, d) => sum + d.totalDonations, 0),
      avgDonation: churnRiskDonors.length > 0 
        ? churnRiskDonors.reduce((sum, d) => sum + d.averageDonation, 0) / churnRiskDonors.length 
        : 0,
      donors: churnRiskDonors.slice(0, 20).map(d => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        totalDonations: d.totalDonations,
        donationCount: d.donationCount,
        lastDonationDate: d.lastDonationDate,
        potentialScore: d.potentialScore,
        churnRiskScore: d.churnRiskScore,
      })),
    });

    // 2. Segment "Potentiel upgrade"
    const upgradePotentialDonors = allDonors.filter(d => {
      // Donateurs réguliers avec potentiel d'augmentation
      const hasRegularDonations = d.donationCount >= 3;
      const hasGrowthPotential = d.potentialScore && d.potentialScore >= 50 && d.potentialScore < 80;
      const isActive = d.status === "ACTIVE";
      const hasModerateAvg = d.averageDonation >= 50 && d.averageDonation < 500;
      
      return hasRegularDonations && hasGrowthPotential && isActive && hasModerateAvg;
    });

    smartSegments.push({
      id: "upgrade-potential",
      name: "Potentiel upgrade",
      description: "Donateurs réguliers qui pourraient augmenter leurs dons avec la bonne approche",
      icon: "TrendingUp",
      color: "amber",
      criteria: "≥3 dons, score potentiel 50-80, actif, don moyen 50-500$",
      donorCount: upgradePotentialDonors.length,
      totalValue: upgradePotentialDonors.reduce((sum, d) => sum + d.totalDonations, 0),
      avgDonation: upgradePotentialDonors.length > 0 
        ? upgradePotentialDonors.reduce((sum, d) => sum + d.averageDonation, 0) / upgradePotentialDonors.length 
        : 0,
      donors: upgradePotentialDonors.slice(0, 20).map(d => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        totalDonations: d.totalDonations,
        donationCount: d.donationCount,
        lastDonationDate: d.lastDonationDate,
        potentialScore: d.potentialScore,
        churnRiskScore: d.churnRiskScore,
      })),
    });

    // 3. Segment "Donateurs majeurs potentiels"
    const majorGiftPotentialDonors = allDonors.filter(d => {
      // Donateurs avec fort potentiel de don majeur
      if (d.potentialScore && d.potentialScore >= 75) return true;
      if (d.highestDonation >= 1000) return true;
      if (d.totalDonations >= 5000 && d.donationCount >= 5) return true;
      return false;
    });

    smartSegments.push({
      id: "major-gift-potential",
      name: "Donateurs majeurs potentiels",
      description: "Donateurs avec un fort potentiel pour des dons majeurs - candidats pour cultivation",
      icon: "Star",
      color: "emerald",
      criteria: "Score potentiel ≥ 75 OU don max ≥ 1000$ OU total ≥ 5000$ avec ≥5 dons",
      donorCount: majorGiftPotentialDonors.length,
      totalValue: majorGiftPotentialDonors.reduce((sum, d) => sum + d.totalDonations, 0),
      avgDonation: majorGiftPotentialDonors.length > 0 
        ? majorGiftPotentialDonors.reduce((sum, d) => sum + d.averageDonation, 0) / majorGiftPotentialDonors.length 
        : 0,
      donors: majorGiftPotentialDonors.slice(0, 20).map(d => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        totalDonations: d.totalDonations,
        donationCount: d.donationCount,
        lastDonationDate: d.lastDonationDate,
        potentialScore: d.potentialScore,
        churnRiskScore: d.churnRiskScore,
      })),
    });

    // 4. Segment "Nouveaux donateurs à fidéliser"
    const newDonorsToRetain = allDonors.filter(d => {
      if (!d.firstDonationDate) return false;
      const daysSinceFirstDonation = Math.floor(
        (Date.now() - new Date(d.firstDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceFirstDonation <= 90 && d.donationCount <= 2;
    });

    smartSegments.push({
      id: "new-to-retain",
      name: "Nouveaux à fidéliser",
      description: "Nouveaux donateurs des 90 derniers jours - opportunité de fidélisation",
      icon: "UserPlus",
      color: "blue",
      criteria: "Premier don dans les 90 derniers jours, ≤2 dons",
      donorCount: newDonorsToRetain.length,
      totalValue: newDonorsToRetain.reduce((sum, d) => sum + d.totalDonations, 0),
      avgDonation: newDonorsToRetain.length > 0 
        ? newDonorsToRetain.reduce((sum, d) => sum + d.averageDonation, 0) / newDonorsToRetain.length 
        : 0,
      donors: newDonorsToRetain.slice(0, 20).map(d => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        totalDonations: d.totalDonations,
        donationCount: d.donationCount,
        lastDonationDate: d.lastDonationDate,
        potentialScore: d.potentialScore,
        churnRiskScore: d.churnRiskScore,
      })),
    });

    // 5. Segment "Champions fidèles"
    const loyalChampions = allDonors.filter(d => {
      const hasHighDonationCount = d.donationCount >= 10;
      const isActive = d.status === "ACTIVE";
      const hasLowChurnRisk = !d.churnRiskScore || d.churnRiskScore < 30;
      
      return hasHighDonationCount && isActive && hasLowChurnRisk;
    });

    smartSegments.push({
      id: "loyal-champions",
      name: "Champions fidèles",
      description: "Donateurs très fidèles avec un engagement constant - ambassadeurs potentiels",
      icon: "Trophy",
      color: "purple",
      criteria: "≥10 dons, actif, risque de churn < 30",
      donorCount: loyalChampions.length,
      totalValue: loyalChampions.reduce((sum, d) => sum + d.totalDonations, 0),
      avgDonation: loyalChampions.length > 0 
        ? loyalChampions.reduce((sum, d) => sum + d.averageDonation, 0) / loyalChampions.length 
        : 0,
      donors: loyalChampions.slice(0, 20).map(d => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        totalDonations: d.totalDonations,
        donationCount: d.donationCount,
        lastDonationDate: d.lastDonationDate,
        potentialScore: d.potentialScore,
        churnRiskScore: d.churnRiskScore,
      })),
    });

    // 6. Segment "Donateurs récurrents"
    const recurringDonors = allDonors.filter(d => {
      // Donateurs avec pattern de dons réguliers
      if (d.donationCount < 4) return false;
      if (!d.firstDonationDate || !d.lastDonationDate) return false;
      
      const totalDays = Math.floor(
        (new Date(d.lastDonationDate).getTime() - new Date(d.firstDonationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (totalDays < 90) return false;
      
      // Calculer la fréquence moyenne
      const avgDaysBetweenDonations = totalDays / (d.donationCount - 1);
      
      // Considérer comme récurrent si don en moyenne tous les 90 jours ou moins
      return avgDaysBetweenDonations <= 90;
    });

    smartSegments.push({
      id: "recurring-donors",
      name: "Donateurs récurrents",
      description: "Donateurs avec un pattern de dons réguliers - candidats pour dons mensuels",
      icon: "RefreshCw",
      color: "cyan",
      criteria: "≥4 dons, fréquence moyenne ≤ 90 jours",
      donorCount: recurringDonors.length,
      totalValue: recurringDonors.reduce((sum, d) => sum + d.totalDonations, 0),
      avgDonation: recurringDonors.length > 0 
        ? recurringDonors.reduce((sum, d) => sum + d.averageDonation, 0) / recurringDonors.length 
        : 0,
      donors: recurringDonors.slice(0, 20).map(d => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        totalDonations: d.totalDonations,
        donationCount: d.donationCount,
        lastDonationDate: d.lastDonationDate,
        potentialScore: d.potentialScore,
        churnRiskScore: d.churnRiskScore,
      })),
    });

    // Statistiques globales
    const stats = {
      totalDonors: allDonors.length,
      segmentedDonors: new Set([
        ...churnRiskDonors.map(d => d.id),
        ...upgradePotentialDonors.map(d => d.id),
        ...majorGiftPotentialDonors.map(d => d.id),
        ...newDonorsToRetain.map(d => d.id),
        ...loyalChampions.map(d => d.id),
        ...recurringDonors.map(d => d.id),
      ]).size,
      totalSegments: smartSegments.length,
    };

    return NextResponse.json({
      success: true,
      segments: smartSegments,
      stats,
    });
  } catch (error) {
    console.error("Error fetching smart segments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch smart segments" },
      { status: 500 }
    );
  }
}

// POST /api/segments/smart - Assigner un segment intelligent à des donateurs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segmentId, donorIds, action } = body;

    if (!segmentId || !donorIds || !Array.isArray(donorIds)) {
      return NextResponse.json(
        { success: false, error: "segmentId and donorIds array are required" },
        { status: 400 }
      );
    }

    // Mapper les segments intelligents vers des tags
    const segmentTagMap: Record<string, string> = {
      "churn-risk": "AI:À risque de churn",
      "upgrade-potential": "AI:Potentiel upgrade",
      "major-gift-potential": "AI:Donateur majeur potentiel",
      "new-to-retain": "AI:Nouveau à fidéliser",
      "loyal-champions": "AI:Champion fidèle",
      "recurring-donors": "AI:Donateur récurrent",
    };

    const tag = segmentTagMap[segmentId];
    if (!tag) {
      return NextResponse.json(
        { success: false, error: "Invalid segment ID" },
        { status: 400 }
      );
    }

    // Mettre à jour les donateurs
    let updatedCount = 0;
    for (const donorId of donorIds) {
      const donor = await prisma.donor.findUnique({
        where: { id: donorId },
        select: { tags: true },
      });

      if (donor) {
        let newTags = [...donor.tags];
        
        if (action === "add") {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        } else if (action === "remove") {
          newTags = newTags.filter(t => t !== tag);
        }

        await prisma.donor.update({
          where: { id: donorId },
          data: { tags: newTags },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} donateurs mis à jour`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error updating smart segments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update smart segments" },
      { status: 500 }
    );
  }
}
