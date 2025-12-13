import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma-org";
import { getOrganizationId } from "@/lib/organization";

// Algorithme de scoring prédictif pour les donateurs
// Basé sur plusieurs facteurs: historique des dons, fréquence, récence, montants, engagement

interface DonorScoringData {
  id: string;
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  highestDonation: number;
  lastDonationDate: Date | null;
  firstDonationDate: Date | null;
  status: string;
  donorType: string;
  segment: string | null;
  consentEmail: boolean;
}

// Calcul du score de potentiel major gift (1-100)
function calculatePotentialScore(donor: DonorScoringData): number {
  let score = 0;
  
  // 1. Montant total des dons (max 25 points)
  if (donor.totalDonations >= 10000) score += 25;
  else if (donor.totalDonations >= 5000) score += 20;
  else if (donor.totalDonations >= 2000) score += 15;
  else if (donor.totalDonations >= 1000) score += 10;
  else if (donor.totalDonations >= 500) score += 5;
  
  // 2. Don moyen (max 20 points)
  if (donor.averageDonation >= 1000) score += 20;
  else if (donor.averageDonation >= 500) score += 15;
  else if (donor.averageDonation >= 250) score += 10;
  else if (donor.averageDonation >= 100) score += 5;
  
  // 3. Don le plus élevé (max 20 points)
  if (donor.highestDonation >= 5000) score += 20;
  else if (donor.highestDonation >= 2000) score += 15;
  else if (donor.highestDonation >= 1000) score += 10;
  else if (donor.highestDonation >= 500) score += 5;
  
  // 4. Fréquence des dons (max 15 points)
  if (donor.donationCount >= 10) score += 15;
  else if (donor.donationCount >= 5) score += 10;
  else if (donor.donationCount >= 3) score += 7;
  else if (donor.donationCount >= 2) score += 4;
  
  // 5. Engagement (récence) (max 10 points)
  if (donor.lastDonationDate) {
    const daysSinceLastDonation = Math.floor(
      (Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastDonation <= 30) score += 10;
    else if (daysSinceLastDonation <= 90) score += 7;
    else if (daysSinceLastDonation <= 180) score += 4;
    else if (daysSinceLastDonation <= 365) score += 2;
  }
  
  // 6. Type de donateur (max 10 points)
  if (donor.donorType === "CORPORATE" || donor.donorType === "FOUNDATION") score += 10;
  else if (donor.donorType === "INDIVIDUAL" && donor.totalDonations >= 1000) score += 5;
  
  // Bonus: Segment VIP ou Major
  if (donor.segment?.toLowerCase().includes("major") || donor.segment?.toLowerCase().includes("vip")) {
    score += 5;
  }
  
  return Math.min(100, Math.max(1, score));
}

// Calcul du score de risque de churn (1-100)
function calculateChurnRiskScore(donor: DonorScoringData): number {
  let riskScore = 0;
  
  // 1. Récence du dernier don (max 40 points de risque)
  if (donor.lastDonationDate) {
    const daysSinceLastDonation = Math.floor(
      (Date.now() - new Date(donor.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastDonation > 730) riskScore += 40; // Plus de 2 ans
    else if (daysSinceLastDonation > 365) riskScore += 30; // Plus d'1 an
    else if (daysSinceLastDonation > 180) riskScore += 20; // Plus de 6 mois
    else if (daysSinceLastDonation > 90) riskScore += 10; // Plus de 3 mois
  } else {
    riskScore += 40; // Jamais donné
  }
  
  // 2. Statut du donateur (max 25 points de risque)
  if (donor.status === "LAPSED") riskScore += 25;
  else if (donor.status === "INACTIVE") riskScore += 20;
  else if (donor.status === "DO_NOT_CONTACT") riskScore += 15;
  
  // 3. Fréquence des dons faible (max 15 points de risque)
  if (donor.donationCount === 1) riskScore += 15;
  else if (donor.donationCount === 2) riskScore += 10;
  else if (donor.donationCount <= 3) riskScore += 5;
  
  // 4. Pas de consentement email (max 10 points de risque)
  if (!donor.consentEmail) riskScore += 10;
  
  // 5. Baisse du montant moyen (max 10 points de risque)
  // Approximation: si le don moyen est très bas par rapport au plus haut
  if (donor.highestDonation > 0 && donor.averageDonation < donor.highestDonation * 0.3) {
    riskScore += 10;
  }
  
  return Math.min(100, Math.max(1, riskScore));
}

// GET: Récupérer les scores d'un ou plusieurs donateurs
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    const prisma = await getPrisma(request);
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get("donorId");
    const recalculate = searchParams.get("recalculate") === "true";
    
    if (donorId) {
      // Score d'un donateur spécifique
      const donor = await prisma.donor.findFirst({
        where: { 
          id: donorId,
          organizationId,
        },
        select: {
          id: true,
          totalDonations: true,
          donationCount: true,
          averageDonation: true,
          highestDonation: true,
          lastDonationDate: true,
          firstDonationDate: true,
          status: true,
          donorType: true,
          segment: true,
          consentEmail: true,
          potentialScore: true,
          churnRiskScore: true,
          scoreUpdatedAt: true,
        },
      });
      
      if (!donor) {
        return NextResponse.json({ error: "Donateur non trouvé" }, { status: 404 });
      }
      
      // Recalculer si demandé ou si pas de score
      if (recalculate || !donor.potentialScore || !donor.churnRiskScore) {
        const potentialScore = calculatePotentialScore(donor);
        const churnRiskScore = calculateChurnRiskScore(donor);
        
        await prisma.donor.update({
          where: { id: donorId },
          data: {
            potentialScore,
            churnRiskScore,
            scoreUpdatedAt: new Date(),
          },
        });
        
        return NextResponse.json({
          donorId,
          potentialScore,
          churnRiskScore,
          scoreUpdatedAt: new Date(),
        });
      }
      
      return NextResponse.json({
        donorId: donor.id,
        potentialScore: donor.potentialScore,
        churnRiskScore: donor.churnRiskScore,
        scoreUpdatedAt: donor.scoreUpdatedAt,
      });
    }
    
    // Stats globales des scores
    const stats = await prisma.donor.aggregate({
      where: { organizationId },
      _avg: {
        potentialScore: true,
        churnRiskScore: true,
      },
      _count: {
        potentialScore: true,
      },
    });
    
    // Distribution des scores
    const highPotential = await prisma.donor.count({
      where: { 
        organizationId,
        potentialScore: { gte: 70 } 
      },
    });
    const mediumPotential = await prisma.donor.count({
      where: { 
        organizationId,
        potentialScore: { gte: 40, lt: 70 } 
      },
    });
    const lowPotential = await prisma.donor.count({
      where: { 
        organizationId,
        potentialScore: { lt: 40 } 
      },
    });
    
    const highRisk = await prisma.donor.count({
      where: { 
        organizationId,
        churnRiskScore: { gte: 70 } 
      },
    });
    const mediumRisk = await prisma.donor.count({
      where: { 
        organizationId,
        churnRiskScore: { gte: 40, lt: 70 } 
      },
    });
    const lowRisk = await prisma.donor.count({
      where: { 
        organizationId,
        churnRiskScore: { lt: 40 } 
      },
    });
    
    return NextResponse.json({
      stats: {
        avgPotentialScore: Math.round(stats._avg.potentialScore || 0),
        avgChurnRiskScore: Math.round(stats._avg.churnRiskScore || 0),
        donorsWithScores: stats._count.potentialScore,
      },
      distribution: {
        potential: { high: highPotential, medium: mediumPotential, low: lowPotential },
        churnRisk: { high: highRisk, medium: mediumRisk, low: lowRisk },
      },
    });
  } catch (error) {
    console.error("Erreur scoring:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Recalculer les scores pour tous les donateurs ou une sélection
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationId(request);
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    const prisma = await getPrisma(request);
    const body = await request.json();
    const { donorIds, all } = body;
    
    let donors;
    
    if (all) {
      // Tous les donateurs de l'organisation
      donors = await prisma.donor.findMany({
        where: { organizationId },
        select: {
          id: true,
          totalDonations: true,
          donationCount: true,
          averageDonation: true,
          highestDonation: true,
          lastDonationDate: true,
          firstDonationDate: true,
          status: true,
          donorType: true,
          segment: true,
          consentEmail: true,
        },
      });
    } else if (donorIds && donorIds.length > 0) {
      // Sélection de donateurs
      donors = await prisma.donor.findMany({
        where: { 
          id: { in: donorIds },
          organizationId,
        },
        select: {
          id: true,
          totalDonations: true,
          donationCount: true,
          averageDonation: true,
          highestDonation: true,
          lastDonationDate: true,
          firstDonationDate: true,
          status: true,
          donorType: true,
          segment: true,
          consentEmail: true,
        },
      });
    } else {
      return NextResponse.json({ error: "Spécifiez donorIds ou all=true" }, { status: 400 });
    }
    
    // Calculer et mettre à jour les scores
    let updated = 0;
    for (const donor of donors) {
      const potentialScore = calculatePotentialScore(donor);
      const churnRiskScore = calculateChurnRiskScore(donor);
      
      await prisma.donor.update({
        where: { id: donor.id },
        data: {
          potentialScore,
          churnRiskScore,
          scoreUpdatedAt: new Date(),
        },
      });
      updated++;
    }
    
    return NextResponse.json({
      success: true,
      updated,
      message: `${updated} donateur(s) mis à jour`,
    });
  } catch (error) {
    console.error("Erreur calcul scores:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
